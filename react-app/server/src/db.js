import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_FILE = process.env.SQLITE_FILE
  ? path.resolve(process.env.SQLITE_FILE)
  : path.join(__dirname, '..', 'data', 'tk_easy.sqlite');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create the tables on first run (no-op if they already exist).
const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
if (fs.existsSync(schemaPath)) {
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
}

const isRead = (sql) => /^\s*(select|pragma|with|explain)/i.test(sql);

// Routes were written against mysql2 and check for err.code === 'ER_DUP_ENTRY',
// so translate SQLite's unique-constraint errors to the same code.
function translateError(err) {
  if (err && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    err.code = 'ER_DUP_ENTRY';
  }
  return err;
}

// Run one statement synchronously and shape the result like mysql2:
//  - SELECT/PRAGMA -> array of rows
//  - INSERT/UPDATE/DELETE -> { insertId, affectedRows }
function execStatement(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (isRead(sql)) {
      return stmt.all(...params);
    }
    const info = stmt.run(...params);
    return { insertId: Number(info.lastInsertRowid), affectedRows: info.changes };
  } catch (err) {
    throw translateError(err);
  }
}

export async function query(sql, params = []) {
  return execStatement(sql, params);
}

// Minimal pool shim so existing health-check code (pool.query) keeps working.
export const pool = {
  query: async (sql, params = []) => [execStatement(sql, params)],
};

// better-sqlite3 is synchronous, but route transaction callbacks are async
// (they await bcrypt hashing). Serialise transactions through a promise chain
// so two transactions can never interleave on the single shared connection.
let txChain = Promise.resolve();

export function withTransaction(fn) {
  const runTx = async () => {
    db.prepare('BEGIN').run();
    const conn = {
      execute: async (sql, params = []) => [execStatement(sql, params)],
      query: async (sql, params = []) => [execStatement(sql, params)],
    };
    try {
      const result = await fn(conn);
      db.prepare('COMMIT').run();
      return result;
    } catch (err) {
      try {
        db.prepare('ROLLBACK').run();
      } catch {
        /* ignore rollback failure */
      }
      throw translateError(err);
    }
  };

  const result = txChain.then(runTx, runTx);
  txChain = result.then(
    () => {},
    () => {}
  );
  return result;
}
