import { isConfigured } from './loyverse.js';
import { syncProducts } from './loyverse-sync.js';

let running = false;

async function runProductSync(trigger) {
  // Skip if the previous run is still in progress (slow Loyverse / large catalog).
  if (running) {
    console.log(`[loyverse-sync] ข้ามรอบ (${trigger}) เพราะรอบก่อนยังทำงานอยู่`);
    return;
  }
  if (!isConfigured()) {
    console.log(`[loyverse-sync] ข้าม (${trigger}) เพราะยังไม่ได้ตั้งค่า LOYVERSE_TOKEN`);
    return;
  }

  running = true;
  const startedAt = Date.now();
  try {
    const { added, updated, categoriesAdded } = await syncProducts();
    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `[loyverse-sync] (${trigger}) สำเร็จใน ${secs}s — เพิ่ม ${added}, อัปเดต ${updated}, หมวดหมู่ใหม่ ${categoriesAdded}`
    );
  } catch (err) {
    console.error(`[loyverse-sync] (${trigger}) ล้มเหลว: ${err.message}`);
  } finally {
    running = false;
  }
}

// Start the periodic product sync. Interval is controlled by LOYVERSE_SYNC_MINUTES
// (default 30). Set it to 0 to disable the scheduler entirely.
export function startLoyverseAutoSync() {
  const minutes = Number(process.env.LOYVERSE_SYNC_MINUTES ?? 30);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.log('[loyverse-sync] ปิดการซิงค์อัตโนมัติ (LOYVERSE_SYNC_MINUTES=0)');
    return;
  }
  if (!isConfigured()) {
    console.log('[loyverse-sync] ยังไม่ได้ตั้งค่า LOYVERSE_TOKEN — ข้ามการตั้งซิงค์อัตโนมัติ');
    return;
  }

  const intervalMs = minutes * 60 * 1000;
  console.log(`[loyverse-sync] ตั้งซิงค์สินค้าอัตโนมัติทุก ${minutes} นาที`);

  // Run once shortly after startup, then on the fixed interval.
  setTimeout(() => runProductSync('startup'), 10_000);
  setInterval(() => runProductSync('scheduled'), intervalMs);
}
