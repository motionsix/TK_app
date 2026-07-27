import { Router } from 'express';
import { query } from '../db.js';
import { authRequired, adminRequired } from '../auth.js';

const router = Router();
router.use(authRequired, adminRequired);

function stockStatus(current, maxStock) {
  const max = Math.max(Number(maxStock) || 1, 1);
  const stock = Math.max(0, Number(current) || 0);
  const percentage = Math.round((stock / max) * 100);
  let alertLevel = 'normal';
  let statusText = 'ปกติ';
  if (percentage <= 10) {
    alertLevel = 'critical';
    statusText = 'วิกฤต (ต้องเติมด่วน)';
  } else if (percentage <= 20) {
    alertLevel = 'warning';
    statusText = 'เตือนสต็อกต่ำ';
  } else if (percentage <= 50) {
    alertLevel = 'moderate';
    statusText = 'ปานกลาง';
  }
  return { percentage, alertLevel, statusText };
}

router.get('/summary', async (_req, res) => {
  try {
    const [{ c: totalProducts }] = await query('SELECT COUNT(*) AS c FROM products');
    const items = await query(
      `SELECT p.id, p.name, p.stock,
              COALESCE(SUM(CASE WHEN o.created_at >= datetime('now', '-30 days') THEN oi.qty ELSE 0 END), 0) AS sold_30d
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'ยกเลิก'
       GROUP BY p.id`
    );

    let lowStockCount = 0;
    let top = null;
    for (const it of items) {
      const sold = Number(it.sold_30d) || 0;
      const maxStock = Math.max(Number(it.stock) || 0, sold * 2, 20);
      if (stockStatus(it.stock, maxStock).percentage <= 20) lowStockCount += 1;
      if (!top || sold > top.sold) top = { name: it.name, sold };
    }

    const [{ predicted }] = await query(
      `SELECT COALESCE(SUM(oi.qty), 0) AS predicted
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'ยกเลิก' AND o.created_at >= datetime('now', '-7 days')`
    );

    res.json({
      success: true,
      data: {
        totalProducts: Number(totalProducts) || 0,
        lowStockCount,
        topSellingProduct: top?.name || '-',
        predictedNextWeekOrders: Math.round((Number(predicted) || 0) * 1.15),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/forecast', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT strftime('%Y-%m', o.created_at) AS ym, SUM(oi.qty) AS qty
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'ยกเลิก'
         AND o.created_at >= datetime('now', '-6 months')
       GROUP BY ym
       ORDER BY ym ASC`
    );

    const monthNames = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];

    const byMonth = new Map(rows.map((r) => [r.ym, Number(r.qty) || 0]));
    const chartData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const actual = byMonth.get(ym) || 0;
      chartData.push({
        month: monthNames[d.getUTCMonth()],
        actual,
        forecast: Math.round(actual * 0.95) || actual,
        'ยอดขายจริง': actual,
        'ยอดพยากรณ์': Math.round(actual * 0.95) || actual,
      });
    }

    const avg =
      chartData.reduce((s, r) => s + (Number(r.actual) || 0), 0) / Math.max(chartData.length, 1);
    for (let i = 1; i <= 2; i += 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      const forecast = Math.round(avg * (1 + 0.08 * i));
      chartData.push({
        month: monthNames[d.getUTCMonth()],
        actual: null,
        forecast,
        'ยอดขายจริง': 0,
        'ยอดพยากรณ์': forecast,
      });
    }

    res.json({ success: true, data: chartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stock-status', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT p.id, p.name, p.stock, p.price,
              COALESCE(c.name, 'ทั่วไป') AS category,
              COALESCE(SUM(CASE WHEN o.created_at >= datetime('now', '-30 days') THEN oi.qty ELSE 0 END), 0) AS monthlySales
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'ยกเลิก'
       GROUP BY p.id
       ORDER BY p.name ASC`
    );

    const data = rows.map((item) => {
      const monthlySales = Number(item.monthlySales) || 0;
      const currentStock = Number(item.stock) || 0;
      const maxStock = Math.max(currentStock, monthlySales * 2, 20);
      const status = stockStatus(currentStock, maxStock);
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock,
        maxStock,
        unitPrice: Number(item.price) || 0,
        monthlySales,
        predictedDemand: Math.round(monthlySales * 1.15),
        ...status,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
