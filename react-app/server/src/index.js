import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shop.js';
import adminRoutes from './routes/admin.js';
import loyverseRoutes from './routes/loyverse.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Behind a reverse proxy (nginx/Plesk). Trust the first hop so req.ip is the
// real client IP — needed for rate limiting to key on the actual visitor.
app.set('trust proxy', 1);

// Gzip/deflate responses (HTML, JS, CSS, JSON). Big win for the bundle.
app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded product images — cache for a week (images rarely change after upload).
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '7d',
    immutable: false,
  })
);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'db_error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', shopRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/loyverse', loyverseRoutes);

// Production: serve the built React client from the same origin so the client's
// relative `/api` and `/uploads` calls just work (no CORS, no separate host).
// Run `npm run build` in ../client first to generate this folder.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  // Hashed assets (e.g. index-ab12cd.js) never change content -> cache 1 year.
  // index.html is the only entry that changes per deploy, so it's served below
  // with no-cache so visitors always pick up the latest asset hashes.
  app.use(
    express.static(clientDist, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );
  // SPA fallback: anything that isn't /api or /uploads returns index.html
  // so React Router can handle the route on the client.
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralised error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

app.listen(PORT, () => {
  console.log(`TK EASY STORE API running on http://localhost:${PORT}`);
});
