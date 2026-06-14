// One-off migration: copy all data from the legacy MySQL database into the
// new SQLite file. Safe to re-run (it clears the SQLite tables first).
//
//   npm run migrate:sqlite
//
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

// Parent tables first so foreign keys resolve cleanly.
const TABLES = [
  'users',
  'members',
  'categories',
  'products',
  'carts',
  'cart_items',
  'orders',
  'order_items',
];

function toSqlite(value) {
  if (value instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return (
      `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())} ` +
      `${p(value.getHours())}:${p(value.getMinutes())}:${p(value.getSeconds())}`
    );
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value; // null / number / string are fine as-is
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'crusaova_musicwebapp',
    charset: 'utf8mb4',
    decimalNumbers: true,
  });
  console.log('Connected to MySQL:', process.env.DB_NAME);

  const sqliteCols = {};
  for (const t of TABLES) {
    sqliteCols[t] = db
      .prepare(`PRAGMA table_info(${t})`)
      .all()
      .map((c) => c.name);
  }

  db.pragma('foreign_keys = OFF');

  // Start clean so the migration is idempotent.
  db.transaction(() => {
    for (const t of [...TABLES].reverse()) db.prepare(`DELETE FROM ${t}`).run();
    db.prepare(`DELETE FROM sqlite_sequence`).run();
  })();

  const summary = {};
  for (const t of TABLES) {
    const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
    if (!rows.length) {
      summary[t] = 0;
      continue;
    }

    const cols = sqliteCols[t].filter((c) => c in rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`);

    const insertMany = db.transaction((items) => {
      for (const row of items) {
        stmt.run(...cols.map((c) => toSqlite(row[c])));
      }
    });
    insertMany(rows);
    summary[t] = rows.length;
  }

  db.pragma('foreign_keys = ON');
  await conn.end();

  console.log('Migration complete:');
  for (const t of TABLES) console.log(`  ${t}: ${summary[t]} rows`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
