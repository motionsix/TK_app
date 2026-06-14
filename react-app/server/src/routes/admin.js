import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { query, withTransaction } from '../db.js';
import { authRequired, adminRequired, hashPassword } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const SHARE_RATE = 0.06;
const PURCHASE_RATE = 0.03;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `p_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.gif'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(null, ok);
  },
});

// Separate uploader for CSV import: kept in memory (no temp file to clean up),
// and only accepts .csv so it doesn't share the image filter that silently
// dropped CSV uploads.
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = path.extname(file.originalname).toLowerCase() === '.csv';
    cb(null, ok);
  },
});

const router = Router();
router.use(authRequired, adminRequired);

/* ---------------- Dashboard stats ---------------- */
router.get('/stats', async (_req, res) => {
  const [p] = await query('SELECT COUNT(*) AS c FROM products');
  const [m] = await query('SELECT COUNT(*) AS c FROM members');
  const [o] = await query("SELECT COUNT(*) AS c FROM orders WHERE status = 'รอดำเนินการ'");
  res.json({ products: p.c, members: m.c, pendingOrders: o.c });
});

/* ---------------- Categories ---------------- */
router.post('/categories', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });
  await query('INSERT INTO categories (name) VALUES (?)', [name]);
  res.json({ message: 'เพิ่มหมวดหมู่แล้ว' });
});

router.delete('/categories/:id', async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [parseInt(req.params.id, 10) || 0]);
  res.json({ message: 'ลบหมวดหมู่แล้ว' });
});

/* ---------------- Products ---------------- */
function imagePath(file) {
  return file ? `uploads/${file.filename}` : null;
}
function removeImage(rel) {
  if (!rel) return;
  const abs = path.join(UPLOAD_DIR, path.basename(rel));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

router.post('/products', upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  await query(
    `INSERT INTO products (category_id, name, description, price, stock, image, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      parseInt(category, 10) || null,
      (name || '').trim(),
      (description || '').trim(),
      parseFloat(price) || 0,
      parseInt(stock, 10) || 0,
      imagePath(req.file),
    ]
  );
  res.json({ message: 'บันทึกสินค้าใหม่แล้ว' });
});

router.put('/products/:id', upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const { name, description, price, stock, category } = req.body;

  const [product] = await query('SELECT image FROM products WHERE id = ?', [id]);
  if (!product) return res.status(404).json({ message: 'ไม่พบสินค้า' });

  let image = product.image;
  if (req.file) {
    removeImage(product.image);
    image = imagePath(req.file);
  }

  await query(
    'UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?, image=? WHERE id=?',
    [
      parseInt(category, 10) || null,
      (name || '').trim(),
      (description || '').trim(),
      parseFloat(price) || 0,
      parseInt(stock, 10) || 0,
      image,
      id,
    ]
  );
  res.json({ message: 'บันทึกการแก้ไขแล้ว' });
});

router.post('/products/:id/stock', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const addQty = parseInt(req.body.add_qty, 10) || 0;
  if (addQty > 0) {
    await query('UPDATE products SET stock = stock + ? WHERE id = ?', [addQty, id]);
  }
  res.json({ message: 'เติมสต็อกแล้ว' });
});

router.delete('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const [product] = await query('SELECT image FROM products WHERE id = ?', [id]);
  if (product) removeImage(product.image);
  await query('DELETE FROM products WHERE id = ?', [id]);
  res.json({ message: 'ลบสินค้าแล้ว' });
});

/* ---------------- Orders ---------------- */
// สต็อกถูกตัดตอน checkout; คืนกลับเมื่อยกเลิก/ลบออเดอร์ที่ยังกันสต็อกไว้
async function restoreStock(conn, orderId) {
  const [items] = await conn.query('SELECT product_id, qty FROM order_items WHERE order_id = ?', [
    orderId,
  ]);
  for (const it of items) {
    await conn.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [
      it.qty,
      it.product_id,
    ]);
  }
}

// สถานะที่ยัง "กันสต็อก" ไว้ = รอดำเนินการ (ยังไม่ approved/rejected)
const holdsStock = (status) => {
  const st = (status || '').trim().toLowerCase();
  return st !== 'approved' && st !== 'rejected';
};

router.get('/orders', async (_req, res) => {
  const orders = await query(
    `SELECT o.id, o.name, o.address, o.phone, o.total_price, o.status, o.created_at, u.username
     FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`
  );
  res.json(orders);
});

router.get('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const [order] = await query(
    `SELECT o.*, u.username, u.full_name FROM orders o
     JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
    [id]
  );
  if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
  const items = await query(
    `SELECT oi.*, p.name AS product_name, p.image FROM order_items oi
     JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
    [id]
  );
  res.json({ order, items });
});

router.post('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const action = req.body.action;

  const [order] = await query('SELECT status FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });

  if (action === 'received') {
    await query("UPDATE orders SET status = 'approved' WHERE id = ?", [id]);
    return res.json({ message: 'ยืนยันการรับสินค้าสำเร็จ' });
  }
  if (action === 'cancel') {
    if ((order.status || '').trim().toLowerCase() === 'rejected') {
      return res.json({ message: 'รายการนี้ถูกยกเลิกไปแล้ว' });
    }
    const willRestore = holdsStock(order.status);
    await withTransaction(async (conn) => {
      if (willRestore) await restoreStock(conn, id);
      await conn.execute("UPDATE orders SET status = 'rejected' WHERE id = ?", [id]);
    });
    return res.json({
      message: willRestore
        ? 'ยกเลิกรายการสั่งซื้อและคืนสต็อกเรียบร้อย'
        : 'ยกเลิกรายการสั่งซื้อเรียบร้อย',
    });
  }
  res.status(400).json({ message: 'ไม่พบ Action ที่ต้องการ' });
});

router.delete('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const [order] = await query('SELECT status FROM orders WHERE id = ?', [id]);
  // คืนสต็อกก่อนลบ เฉพาะออเดอร์ที่ยังกันสต็อกไว้ (ยังไม่ approved/rejected)
  const willRestore = order && holdsStock(order.status);

  await withTransaction(async (conn) => {
    if (willRestore) await restoreStock(conn, id);
    await conn.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    await conn.execute('DELETE FROM orders WHERE id = ?', [id]);
  });
  res.json({ message: 'ลบข้อมูลออกจากระบบถาวรสำเร็จ' });
});

/* ---------------- Users ---------------- */
router.get('/users', async (_req, res) => {
  const users = await query(
    `SELECT u.id AS u_id, u.username, u.full_name, u.role, u.created_at, m.share_amount
     FROM users u LEFT JOIN members m ON u.id = m.user_id ORDER BY u.id DESC`
  );
  res.json(users);
});

router.delete('/users/:id', async (req, res) => {
  await query('DELETE FROM users WHERE id = ?', [parseInt(req.params.id, 10) || 0]);
  res.json({ message: 'ลบสมาชิกแล้ว' });
});

// CSV columns: Username, Password, Full_Name, Role, Share_Amount
router.post('/users/import', csvUpload.single('csv_file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์ CSV (.csv)' });

  let records;
  try {
    records = parse(req.file.buffer, { skip_empty_lines: true, from_line: 2 });
  } catch {
    return res.status(400).json({ message: 'ไม่สามารถอ่านไฟล์ CSV ได้' });
  }

  let count = 0;
  for (const row of records) {
    const username = (row[0] || '').trim();
    if (!username) continue;
    const password = (row[1] || '').trim();
    const fullName = (row[2] || '').trim();
    const rawRole = (row[3] || 'student').trim().toLowerCase();
    const role = ['student', 'teacher', 'admin'].includes(rawRole) ? rawRole : 'student';
    const share = parseFloat(row[4]) || 0;

    const [exists] = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists) continue;

    try {
      await withTransaction(async (conn) => {
        const hashed = await hashPassword(password);
        const [r] = await conn.execute(
          'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
          [username, hashed, fullName, role]
        );
        await conn.execute(
          'INSERT INTO members (user_id, name, share_amount, months_held) VALUES (?, ?, ?, 12)',
          [r.insertId, fullName, share]
        );
      });
      count++;
    } catch {
      /* skip duplicates / bad rows */
    }
  }
  res.json({ message: `นำเข้าข้อมูล ${count} รายการเรียบร้อย`, count });
});

/* ---------------- Members / dividend ---------------- */
router.get('/members', async (req, res) => {
  const search = (req.query.search || '').trim();
  const ratePercent = parseFloat(req.query.rate) || 6;
  const rate = ratePercent / 100;

  const members = await query(
    `SELECT m.*,
       (SELECT SUM(total_price) FROM orders WHERE user_id = m.user_id AND status = 'approved') AS total_buy
     FROM members m WHERE m.name LIKE ? ORDER BY m.id DESC`,
    [`%${search}%`]
  );

  let totalShares = 0;
  let totalPurchase = 0;
  let totalDividend = 0;
  const rows = members.map((m) => {
    const shareAmount = Number(m.share_amount) || 0;
    const buy = Number(m.total_buy) || 0;
    const dShare = shareAmount * rate * (Number(m.months_held) / 12);
    const dBuy = buy * PURCHASE_RATE;
    const dividend = dShare + dBuy;
    totalShares += shareAmount;
    totalPurchase += buy;
    totalDividend += dividend;
    return {
      id: m.id,
      name: m.name,
      share_amount: shareAmount,
      months_held: m.months_held,
      total_buy: buy,
      dividend,
    };
  });

  res.json({
    members: rows,
    ratePercent,
    purchaseRatePercent: PURCHASE_RATE * 100,
    totals: { shares: totalShares, purchase: totalPurchase, dividend: totalDividend },
  });
});

router.put('/members/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const shareAmount = parseFloat(req.body.share_amount);
  const monthsHeld = parseInt(req.body.months_held, 10);
  if (!(shareAmount >= 0) || monthsHeld < 1 || monthsHeld > 12) {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
  }
  await query('UPDATE members SET share_amount = ?, months_held = ? WHERE id = ?', [
    shareAmount,
    monthsHeld,
    id,
  ]);
  res.json({ message: 'อัปเดตข้อมูลหุ้นเรียบร้อยแล้ว' });
});

export default router;
