import { query } from './db.js';
import { fetchCategories, fetchItems, fetchInventory } from './loyverse.js';

// Add the loyverse_id tracking columns once, so re-syncing updates instead of duplicating.
export async function ensureColumns() {
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

// Pull categories + items + inventory from Loyverse and upsert them locally.
// Shared by the manual "sync products" button and the scheduled auto-sync.
export async function syncProducts() {
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

    const [linked] = await query('SELECT id FROM categories WHERE loyverse_id = ?', [c.id]);
    if (linked) {
      catMap[c.id] = linked.id;
      continue;
    }
    const [byName] = await query('SELECT id FROM categories WHERE name = ?', [name]);
    if (byName) {
      catMap[c.id] = byName.id;
      await query('UPDATE categories SET loyverse_id = ? WHERE id = ?', [c.id, byName.id]);
      continue;
    }
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

  return { added, updated, categoriesAdded: catsAdded };
}
