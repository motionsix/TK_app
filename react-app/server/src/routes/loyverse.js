import { Router } from 'express';
import { query } from '../db.js';
import { authRequired, adminRequired, hashPassword } from '../auth.js';
import {
  isConfigured,
  getMerchant,
  fetchCategories,
  fetchItems,
  fetchInventory,
  fetchCustomers,
} from '../loyverse.js';

const router = Router();
router.use(authRequired, adminRequired);

// Add the loyverse_id tracking columns once, so re-syncing updates instead of duplicating.
async function ensureColumns() {
  const targets = [
    ['categories', 'loyverse_id'],
    ['products', 'loyverse_id'],
    ['users', 'loyverse_id'],
  ];
  for (const [table, column] of targets) {
    const cols = await query(`PRAGMA table_info(${table})`);
    if (!cols.some((col) => col.name === column)) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
    }
  }
}

/* ---------------- Connection status ---------------- */
router.get('/status', async (_req, res) => {
  if (!isConfigured()) {
    return res.json({ configured: false });
  }
  try {
    const merchant = await getMerchant();
    res.json({
      configured: true,
      connected: true,
      business: merchant.business_name || merchant.name || merchant.email || 'Loyverse',
    });
  } catch (err) {
    res.json({ configured: true, connected: false, message: err.message });
  }
});

/* ---------------- Sync products (items + categories + stock) ---------------- */
router.post('/sync-products', async (_req, res) => {
  try {
    await ensureColumns();

    const [lvCategories, lvItems, lvInventory] = await Promise.all([
      fetchCategories(),
      fetchItems(),
      fetchInventory(),
    ]);

    const storeFilter = (process.env.LOYVERSE_STORE_ID || '').trim();
    const stockByVariant = {};
    for (const lvl of lvInventory) {
      if (storeFilter && String(lvl.store_id) !== storeFilter) continue;
      stockByVariant[lvl.variant_id] =
        (stockByVariant[lvl.variant_id] || 0) + (Number(lvl.in_stock) || 0);
    }

    // Upsert categories, mapping Loyverse category id -> local category id.
    const catMap = {};
    let catsAdded = 0;
    for (const c of lvCategories) {
      const name = (c.name || '').trim() || 'ไม่ระบุหมวดหมู่';

      // 1) already linked by loyverse_id?
      const [linked] = await query('SELECT id FROM categories WHERE loyverse_id = ?', [c.id]);
      if (linked) {
        catMap[c.id] = linked.id;
        continue;
      }
      // 2) a category with the same name already exists (e.g. seeded)? adopt it.
      const [byName] = await query('SELECT id FROM categories WHERE name = ?', [name]);
      if (byName) {
        catMap[c.id] = byName.id;
        await query('UPDATE categories SET loyverse_id = ? WHERE id = ?', [c.id, byName.id]);
        continue;
      }
      // 3) brand new category (guard against unique-name races/trailing-space collisions)
      try {
        const r = await query('INSERT INTO categories (name, loyverse_id) VALUES (?, ?)', [
          name,
          c.id,
        ]);
        catMap[c.id] = r.insertId;
        catsAdded += 1;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          const [dup] = await query('SELECT id FROM categories WHERE name = ?', [name]);
          if (dup) {
            catMap[c.id] = dup.id;
            await query('UPDATE categories SET loyverse_id = ? WHERE id = ?', [c.id, dup.id]);
          }
        } else {
          throw e;
        }
      }
    }

    let added = 0;
    let updated = 0;
    for (const item of lvItems) {
      const variants = item.variants || [];
      const price = Number(variants[0]?.default_price) || 0;
      const stock = Math.max(
        0,
        Math.round(variants.reduce((s, v) => s + (stockByVariant[v.variant_id] || 0), 0))
      );
      const categoryId = item.category_id ? catMap[item.category_id] || null : null;
      const image = item.image_url || null;
      const name = item.item_name || item.name || 'ไม่มีชื่อ';
      const description = item.description || '';

      const [existing] = await query('SELECT id FROM products WHERE loyverse_id = ?', [item.id]);
      if (existing) {
        await query(
          'UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?, image=? WHERE id=?',
          [categoryId, name, description, price, stock, image, existing.id]
        );
        updated += 1;
      } else {
        await query(
          `INSERT INTO products (category_id, name, description, price, stock, image, loyverse_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [categoryId, name, description, price, stock, image, item.id]
        );
        added += 1;
      }
    }

    res.json({
      message: `ซิงค์สินค้าสำเร็จ: เพิ่ม ${added}, อัปเดต ${updated} รายการ (หมวดหมู่ใหม่ ${catsAdded})`,
      added,
      updated,
      categoriesAdded: catsAdded,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

/* ---------------- Sync customers -> members ---------------- */
async function uniqueUsername(base) {
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [exists] = await query('SELECT id FROM users WHERE username = ?', [candidate]);
    if (!exists) return candidate;
    candidate = `${base}_${i++}`;
  }
}

router.post('/sync-customers', async (_req, res) => {
  try {
    await ensureColumns();
    const customers = await fetchCustomers();

    const fallbackPw = (process.env.LOYVERSE_DEFAULT_PASSWORD || 'tkstore123').trim();

    let added = 0;
    let updated = 0;
    for (const c of customers) {
      const phone = (c.phone_number || '').replace(/\D/g, '');
      const email = (c.email || '').trim();
      const name = c.name || phone || email || 'ลูกค้า Loyverse';

      // Existing customer: only refresh the name, never touch their (possibly changed) password.
      const [existing] = await query('SELECT id FROM users WHERE loyverse_id = ?', [c.id]);
      if (existing) {
        await query('UPDATE users SET full_name = ? WHERE id = ?', [name, existing.id]);
        await query('UPDATE members SET name = ? WHERE user_id = ?', [name, existing.id]);
        updated += 1;
        continue;
      }

      // Username: phone -> email local part -> loyverse id
      const rawBase =
        phone || (email ? email.split('@')[0] : '') || `loy_${String(c.id).slice(0, 8)}`;
      const base =
        rawBase.replace(/[^a-zA-Z0-9_.@]/g, '').slice(0, 40) || `loy_${String(c.id).slice(0, 8)}`;
      const username = await uniqueUsername(base);

      // Initial password the customer can actually use: their phone number (or a shared default).
      const initialPassword = phone || fallbackPw;
      const password = await hashPassword(initialPassword);

      const r = await query(
        'INSERT INTO users (username, password_hash, full_name, role, loyverse_id) VALUES (?, ?, ?, ?, ?)',
        [username, password, name, 'student', c.id]
      );
      await query(
        'INSERT INTO members (user_id, name, share_amount, months_held) VALUES (?, ?, 0, 12)',
        [r.insertId, name]
      );
      added += 1;
    }

    res.json({
      message:
        `ซิงค์ลูกค้าสำเร็จ: เพิ่ม ${added}, อัปเดต ${updated} ราย ` +
        `(ลูกค้าใหม่ login ด้วยเบอร์โทรเป็นทั้งชื่อผู้ใช้และรหัสผ่าน)`,
      added,
      updated,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

/* ---------------- Link admin account to the Loyverse shop owner ---------------- */
router.post('/link-admin', async (req, res) => {
  try {
    await ensureColumns();
    const merchant = await getMerchant();
    const email = (merchant.email || '').trim();
    const business = merchant.business_name || merchant.name || 'Loyverse';
    if (!email) {
      return res
        .status(400)
        .json({ message: 'บัญชี Loyverse ไม่มีอีเมล จึงผูกบัญชีแอดมินไม่ได้' });
    }

    const providedPw = (req.body?.password || '').trim();
    const initialPw = providedPw || (process.env.LOYVERSE_ADMIN_PASSWORD || 'owner123').trim();

    const [existing] = await query('SELECT id FROM users WHERE username = ?', [email]);
    if (existing) {
      if (providedPw) {
        const hash = await hashPassword(providedPw);
        await query(
          'UPDATE users SET role = ?, loyverse_id = ?, full_name = ?, password_hash = ? WHERE id = ?',
          ['admin', merchant.id, business, hash, existing.id]
        );
      } else {
        await query('UPDATE users SET role = ?, loyverse_id = ?, full_name = ? WHERE id = ?', [
          'admin',
          merchant.id,
          business,
          existing.id,
        ]);
      }
      return res.json({
        message: `ผูกบัญชีแอดมินกับเจ้าของร้าน Loyverse แล้ว`,
        email,
        business,
        created: false,
        passwordChanged: !!providedPw,
      });
    }

    const hash = await hashPassword(initialPw);
    await query(
      'INSERT INTO users (username, password_hash, full_name, role, loyverse_id) VALUES (?, ?, ?, ?, ?)',
      [email, hash, business, 'admin', merchant.id]
    );
    return res.json({
      message: `สร้างบัญชีแอดมินเจ้าของร้านแล้ว`,
      email,
      business,
      created: true,
      // Returned once so the owner can sign in; recommend changing it afterwards.
      initialPassword: initialPw,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
