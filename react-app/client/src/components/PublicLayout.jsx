import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { baht } from '../lib/format';
import ThemeToggle from './ThemeToggle';

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-brand-yellow"
    >
      <i className={`bi ${icon} text-base`} />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

export default function PublicLayout() {
  const { user, shares, dividend, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบ TK EASY STORE ใช่หรือไม่',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    }).then((r) => {
      if (r.isConfirmed) {
        logout();
        navigate('/');
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-brand-blue to-brand-dark text-white shadow-soft">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-5">
          <Link to="/" className="flex items-center gap-3 transition hover:opacity-90">
            <img
              src="/logo.png"
              alt="โลโก้โรงเรียนตราษตระการคุณ"
              className="h-12 w-12 object-contain"
            />
            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-brand-yellow">
                TK EASY STORE
              </span>
              <span className="hidden text-[11px] tracking-wide text-white/70 sm:block">
                สหกรณ์ตราษตระการคุณ
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-1">
              <NavLink to="/" icon="bi-house-door" label="หน้าหลัก" />
              <NavLink to="/my-orders" icon="bi-receipt" label="ประวัติซื้อ" />
              <Link
                to="/cart"
                className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-brand-yellow"
                aria-label="ตะกร้าสินค้า"
              >
                <i className="bi bi-cart3 text-base" />
                <span className="hidden lg:inline">ตะกร้า</span>
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-brand-dark">
                    {count}
                  </span>
                )}
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-yellow transition hover:bg-white/10"
                >
                  <i className="bi bi-shield-lock text-base" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
            </nav>

            <ThemeToggle variant="dark" />

            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 py-1 pl-3 pr-1">
                <span className="hidden text-sm font-medium md:inline">{user.username}</span>
                <div className="flex gap-1">
                  <div
                    className="flex items-center gap-1 rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-dark"
                    title="ยอดหุ้นสะสม"
                  >
                    <i className="bi bi-piggy-bank" /> {baht(shares, 0)}
                  </div>
                  <div
                    className="hidden items-center gap-1 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white sm:flex"
                    title="ปันผลประมาณการ"
                  >
                    <i className="bi bi-stars" /> {baht(dividend)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-red-500"
                  title="ออกจากระบบ"
                  aria-label="ออกจากระบบ"
                >
                  <i className="bi bi-power" />
                </button>
              </div>
            ) : (
              location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="rounded-full bg-brand-yellow px-5 py-2 text-sm font-bold text-brand-dark transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="โลโก้โรงเรียนตราษตระการคุณ"
              className="h-10 w-10 object-contain"
            />
            <div>
              <div className="font-bold text-ink">TK EASY STORE</div>
              <div className="text-xs">สหกรณ์ร้านค้าโรงเรียนตราษตระการคุณ</div>
            </div>
          </div>
          <p className="text-center text-xs sm:text-right">
            ระบบร้านค้าสหกรณ์ออนไลน์ · เชื่อมต่อ Loyverse POS
            <br className="hidden sm:block" />
            &copy; {new Date().getFullYear()} โรงเรียนตราษตระการคุณ
          </p>
        </div>
      </footer>
    </div>
  );
}
