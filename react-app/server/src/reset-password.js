// One-off utility to reset (or create) an admin password directly in the DB.
// Use when an admin forgot their password — the app has no self-service reset.
//
//   node src/reset-password.js                      -> list admin accounts
//   node src/reset-password.js <username> <newPass>  -> reset that user's password
//                                                       (creates an admin if missing)
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const [, , username, newPassword] = process.argv;

if (!username) {
  const admins = db
    .prepare("SELECT id, username, full_name FROM users WHERE role = 'admin' ORDER BY id")
    .all();
  if (admins.length === 0) {
    console.log('ยังไม่มีบัญชี admin ในระบบ');
    console.log('สร้างใหม่ด้วย: node src/reset-password.js <username> <newPassword>');
  } else {
    console.log('บัญชี admin ที่มีอยู่:');
    for (const a of admins) console.log(`  - ${a.username}${a.full_name ? '  (' + a.full_name + ')' : ''}`);
    console.log('\nรีเซ็ตรหัสด้วย: node src/reset-password.js <username> <newPassword>');
  }
  process.exit(0);
}

if (!newPassword) {
  console.error('ต้องระบุรหัสผ่านใหม่: node src/reset-password.js <username> <newPassword>');
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 10);
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
  console.log(`เปลี่ยนรหัสผ่านของ '${username}' เรียบร้อยแล้ว`);
} else {
  db.prepare(
    "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')"
  ).run(username, hash, username);
  console.log(`ไม่พบผู้ใช้เดิม จึงสร้างบัญชี admin ใหม่ '${username}' ให้แล้ว`);
}
process.exit(0);
