import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../auth/AuthContext';
import ThemeToggle from './ThemeToggle';

const menu = [
  { to: '/admin', icon: 'bi-grid-1x2-fill', label: 'Dashboard', end: true },
  { to: '/admin/products', icon: 'bi-boxes', label: 'จัดการสินค้า' },
  { to: '/admin/orders', icon: 'bi-cart-check', label: 'คำสั่งซื้อ' },
  { to: '/admin/dividend', icon: 'bi-graph-up-arrow', label: 'ระบบปันผลหุ้น' },
  { to: '/admin/users', icon: 'bi-person-gear', label: 'จัดการผู้ใช้' },
  { to: '/admin/loyverse', icon: 'bi-arrow-repeat', label: 'เชื่อมต่อ Loyverse' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    }).then((r) => {
      if (r.isConfirmed) {
        logout();
        navigate('/');
      }
    });
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-brand-blue text-white shadow-glow'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  const Sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-yellow text-xl font-black text-slate-900">
            TK
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-brand-yellow">TK ADMIN</div>
            <div className="text-[11px] tracking-wide text-slate-400">Back Office</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {menu.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} onClick={() => setOpen(false)} className={navItemClass}>
            <i className={`bi ${m.icon} text-lg`} />
            {m.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-sm text-slate-400">
            <i className="bi bi-person-circle" /> {user?.username}
          </span>
          <ThemeToggle variant="dark" />
        </div>
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          <i className="bi bi-shop" /> ดูหน้าร้าน
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
        >
          <i className="bi bi-power" /> ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed hidden h-screen w-64 lg:block">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 animate-fadeIn shadow-card">{Sidebar}</div>
        </div>
      )}

      <div className="lg:ml-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
            className="rounded-lg border border-line p-2 text-body"
          >
            <i className="bi bi-list text-xl" />
          </button>
          <div className="flex items-center gap-2 font-extrabold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow text-sm font-black text-slate-900">
              TK
            </span>
            ADMIN
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
