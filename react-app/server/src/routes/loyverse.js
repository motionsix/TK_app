import { Router } from 'express';
import { query } from '../db.js';
import { authRequired, adminRequired, hashPassword } from '../auth.js';
import { isConfigured, getMerchant, fetchCustomers } from '../loyverse.js';
import { ensureColumns, syncProducts } from '../loyverse-sync.js';

const router = Router();
router.use(authRequired, adminRequired);

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
    const { added, updated, categoriesAdded } = await syncProducts();
    res.json({
      message: `ซิงค์สินค้าสำเร็จ: เพิ่ม ${added}, อัปเดต ${updated} รายการ (หมวดหมู่ใหม่ ${categoriesAdded})`,
      added,
      updated,
      categoriesAdded,
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
