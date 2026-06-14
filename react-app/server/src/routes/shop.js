import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();

const SHARE_ACCUMULATION = 0.10; // หุ้นสะสม 10% ของยอดซื้อ

/* ---------------- Public: products & categories ---------------- */

router.get('/categories', async (_req, res) => {
  const cats = await query('SELECT * FROM categories ORDER BY name ASC');
  res.json(cats);
});

router.get('/products', async (req, res) => {
  const cat = parseInt(req.query.cat, 10) || 0;
  const search = (req.query.search || '').trim();

  let sql =
    'SELECT p.*, c.name AS category_name FROM products p ' +
    'LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];
  if (cat > 0) {
    sql += ' AND p.category_id = ?';
    params.push(cat);
  }
  if (search) {
    sql += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY p.id DESC';

  const products = await query(sql, params);
  res.json(products);
});

/* ---------------- Cart (auth required) ---------------- */

async function getOrCreateCart(userId) {
  const [cart] = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (cart) return cart.id;
  const rows = await query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return rows.insertId;
}

router.get('/cart', authRequired, async (req, res) => {
  const [cart] = await query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
  if (!cart) return res.json({ items: [], total: 0 });

  const items = await query(
    `SELECT ci.id AS item_id, p.id AS product_id, p.name, p.price, ci.qty, p.stock, p.image
     FROM cart_items ci JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );
  const total = items.reduce((sum, it) => sum + Number(it.price) * it.qty, 0);
  res.json({ items, total });
});

router.post('/cart', authRequired, async (req, res) => {
  const productId = parseInt(req.body.product_id, 10) || 0;
  const qty = Math.max(1, parseInt(req.body.qty, 10) || 1);

  const [product] = await query('SELECT id FROM products WHERE id = ?', [productId]);
  if (!product) return res.status(404).json({ message: 'ไม่พบสินค้านี้ในระบบ' });

  const cartId = await getOrCreateCart(req.user.id);
  const [existing] = await query(
    'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartId, productId]
  );

  if (existing) {
    await query('UPDATE cart_items SET qty = ? WHERE id = ?', [existing.qty + qty, existing.id]);
  } else {
    await query('INSERT INTO cart_items (cart_id, product_id, qty) VALUES (?, ?, ?)', [
      cartId,
      productId,
      qty,
    ]);
  }
  res.json({ message: 'เพิ่มลงตะกร้าแล้ว' });
});

router.put('/cart/:itemId', authRequired, async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10) || 0;
  const qty = Math.max(1, parseInt(req.body.qty, 10) || 1);
  const [cart] = await query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
  if (!cart) return res.status(404).json({ message: 'ไม่พบตะกร้า' });

  await query('UPDATE cart_items SET qty = ? WHERE id = ? AND cart_id = ?', [qty, itemId, cart.id]);
  res.json({ message: 'อัปเดตตะกร้าแล้ว' });
});

router.delete('/cart/:itemId', authRequired, async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10) || 0;
  const [cart] = await query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
  if (!cart) return res.status(404).json({ message: 'ไม่พบตะกร้า' });

  await query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cart.id]);
  res.json({ message: 'ลบสินค้าออกจากตะกร้าแล้ว' });
});

/* ---------------- Orders / checkout ---------------- */

router.post('/orders', authRequired, async (req, res) => {
  const userId = req.user.id;
  const name = (req.body.name || '').trim();
  const address = (req.body.address || '').trim();
  const phone = (req.body.phone || '').trim();

  if (!name || !address || !phone) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลการรับสินค้าให้ครบถ้วน' });
  }

  const [cart] = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cart) return res.status(400).json({ message: 'ตะกร้าของคุณว่างเปล่า' });

  const items = await query(
    `SELECT p.id AS product_id, p.name, p.price, ci.qty, p.stock
     FROM cart_items ci JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );
  if (!items.length) return res.status(400).json({ message: 'ตะกร้าของคุณว่างเปล่า' });

  try {
    const orderId = await withTransaction(async (conn) => {
      const total = items.reduce((sum, it) => sum + Number(it.price) * it.qty, 0);

      const [orderResult] = await conn.execute(
        `INSERT INTO orders (user_id, name, address, phone, total_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'รอดำเนินการ', CURRENT_TIMESTAMP)`,
        [userId, name, address, phone, total]
      );
      const newOrderId = orderResult.insertId;

      for (const it of items) {
        if (it.qty > it.stock) {
          throw new Error(`สินค้า '${it.name}' มีสต็อกไม่เพียงพอ`);
        }
        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, price, qty) VALUES (?, ?, ?, ?)',
          [newOrderId, it.product_id, it.price, it.qty]
        );
        await conn.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [it.qty, it.product_id, it.qty]
        );
      }

      const shareIncrement = total * SHARE_ACCUMULATION;
      const [[member]] = await conn.query('SELECT id FROM members WHERE user_id = ?', [userId]);
      if (member) {
        await conn.execute('UPDATE members SET share_amount = share_amount + ? WHERE user_id = ?', [
          shareIncrement,
          userId,
        ]);
      } else {
        await conn.execute(
          'INSERT INTO members (user_id, name, share_amount, months_held) VALUES (?, ?, ?, 12)',
          [userId, name, shareIncrement]
        );
      }

      await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
      await conn.execute('DELETE FROM carts WHERE id = ?', [cart.id]);

      return newOrderId;
    });

    res.json({ message: 'สั่งซื้อสำเร็จ', order_id: orderId });
  } catch (err) {
    res.status(400).json({ message: err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ' });
  }
});

router.get('/orders/mine', authRequired, async (req, res) => {
  const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [
    req.user.id,
  ]);
  res.json(orders);
});

router.get('/orders/:id/items', authRequired, async (req, res) => {
  const orderId = parseInt(req.params.id, 10) || 0;

  const [order] = await query('SELECT user_id, total_price FROM orders WHERE id = ?', [orderId]);
  if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' });
  }

  const items = await query(
    `SELECT oi.*, p.name, p.image FROM order_items oi
     JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
    [orderId]
  );
  res.json({ items, total: Number(order.total_price) });
});

export default router;
