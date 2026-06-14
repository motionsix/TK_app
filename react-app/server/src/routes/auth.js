import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query, withTransaction } from '../db.js';
import { signToken, verifyPassword, hashPassword, authRequired } from '../auth.js';

const router = Router();

// กัน brute-force: จำกัดจำนวนครั้งต่อ IP ในช่วงเวลาหนึ่ง
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  limit: 10, // ไม่เกิน 10 ครั้ง/IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'สมัครสมาชิกบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

const SHARE_RATE = 0.06; // ปันผลหุ้น 6% ต่อปี
const PURCHASE_RATE = 0.03; // ปันผลยอดซื้อ 3%

async function buildMemberSummary(userId) {
  const [member] = await query(
    'SELECT share_amount, months_held FROM members WHERE user_id = ?',
    [userId]
  );

  let shares = 0;
  let shareDividend = 0;
  if (member) {
    shares = Number(member.share_amount) || 0;
    const months = Number(member.months_held) || 0;
    shareDividend = shares * SHARE_RATE * (months / 12);
  }

  const [purchase] = await query(
    "SELECT SUM(total_price) AS total FROM orders WHERE user_id = ? AND status = 'approved'",
    [userId]
  );
  const totalPurchase = Number(purchase?.total) || 0;
  const purchaseDividend = totalPurchase * PURCHASE_RATE;

  return {
    shares,
    dividend: shareDividend + purchaseDividend,
  };
}

router.post('/register', registerLimiter, async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const fullName = (req.body.full_name || '').trim();

  if (!username || !password || !fullName) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    await withTransaction(async (conn) => {
      const hashed = await hashPassword(password);
      const [result] = await conn.execute(
        'INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)',
        [username, hashed, fullName]
      );
      const newId = result.insertId;
      await conn.execute(
        'INSERT INTO members (user_id, name, share_amount, months_held) VALUES (?, ?, 0, 12)',
        [newId, fullName]
      );
    });
    res.json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว กรุณาใช้ชื่ออื่น' });
    }
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const [user] = await query(
    'SELECT id, username, password_hash, role, full_name FROM users WHERE username = ?',
    [username]
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    },
  });
});

router.get('/me', authRequired, async (req, res) => {
  const [user] = await query(
    'SELECT id, username, role, full_name FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

  const summary = await buildMemberSummary(user.id);
  res.json({ user, ...summary });
});

export default router;
