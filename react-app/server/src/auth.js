import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES || '7d';

// Fail fast: never fall back to a known/guessable secret. A leaked or default
// secret lets anyone forge admin tokens, so refuse to start without a real one.
const WEAK_SECRET = 'tk_easy_store_dev_secret_change_me';
if (!SECRET || SECRET === WEAK_SECRET || SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET ไม่ปลอดภัย: ตั้งค่าใน .env เป็นสตริงสุ่มยาว ≥ 32 ตัวอักษร ' +
      '(สร้างด้วย: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))")'
  );
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

// PHP's password_hash() produces $2y$ hashes. bcryptjs is built around $2a/$2b,
// which is the identical algorithm, so we normalise the prefix before comparing.
export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  const normalised = hash.startsWith('$2y$') ? '$2b$' + hash.slice(4) : hash;
  return bcrypt.compare(plain, normalised);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
  next();
}
