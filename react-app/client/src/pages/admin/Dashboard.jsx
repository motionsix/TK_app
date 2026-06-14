import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function StatCard({ icon, label, value, unit, color, badge }) {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-6 transition duration-200 ease-out-quint hover:-translate-y-1 hover:shadow-card">
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl ${color}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="min-w-0">
        <h6 className="text-xs font-bold tracking-wide text-muted">{label}</h6>
        <h3 className="mt-1 text-3xl font-extrabold text-ink">
          {value} <small className="text-base font-normal text-muted">{unit}</small>
        </h3>
        {badge && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <i className="bi bi-exclamation-circle-fill" /> รอดำเนินการ
          </span>
        )}
      </div>
    </div>
  );
}

const quickMenu = [
  { to: '/admin/products', icon: 'bi-boxes', label: 'จัดการรายการสินค้า' },
  { to: '/admin/orders', icon: 'bi-cart-check', label: 'จัดการคำสั่งซื้อ' },
  { to: '/admin/dividend', icon: 'bi-graph-up-arrow', label: 'ระบบปันผลหุ้น' },
  { to: '/admin/users', icon: 'bi-person-gear', label: 'จัดการผู้ใช้งาน' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, members: 0, pendingOrders: 0 });

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data));
  }, []);

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8 lg:mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">ภาพรวมระบบ</h1>
        <p className="text-muted">สรุปสถานะร้านสหกรณ์และทางลัดการจัดการ</p>
      </div>

      <div className="mb-10 grid gap-5 sm:gap-6 md:grid-cols-3 lg:mb-12">
        <StatCard
          icon="bi-box-seam"
          label="คลังสินค้า"
          value={stats.products.toLocaleString()}
          unit="รายการ"
          color="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300"
        />
        <StatCard
          icon="bi-people-fill"
          label="สมาชิกทั้งหมด"
          value={stats.members.toLocaleString()}
          unit="คน"
          color="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <StatCard
          icon="bi-megaphone-fill"
          label="รอรับสินค้า"
          value={stats.pendingOrders}
          unit="ออเดอร์"
          color="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300"
          badge={stats.pendingOrders > 0}
        />
      </div>

      <h4 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-ink">
        <i className="bi bi-grid-1x2-fill text-brand-blue dark:text-accent" /> การจัดการระบบ
      </h4>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickMenu.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-7 text-center font-bold text-ink transition duration-200 ease-out-quint hover:-translate-y-1 hover:border-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <i
              className={`bi ${m.icon} flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl text-brand-blue transition group-hover:bg-white/20 group-hover:text-white dark:text-accent`}
            />
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
