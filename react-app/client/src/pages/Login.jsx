import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: err.response?.data?.message || 'เกิดข้อผิดพลาด',
        confirmButtonColor: '#0056b3',
        confirmButtonText: 'ลองอีกครั้ง',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md overflow-hidden shadow-card">
        <div className="bg-brand-gradient px-8 py-8 text-center text-white sm:px-10">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            <i className="bi bi-person-lock" />
          </span>
          <h2 className="text-2xl font-extrabold text-white">เข้าสู่ระบบ</h2>
          <p className="text-sm text-white/80">TK EASY STORE · สหกรณ์โรงเรียน</p>
        </div>

        <div className="p-8 sm:p-10">
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-11"
                placeholder="ชื่อผู้ใช้ (Username)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="relative">
              <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                className="input pl-11 pr-11"
                placeholder="รหัสผ่าน (Password)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}{' '}
              <i className="bi bi-arrow-right-short text-lg" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            ยังไม่มีบัญชีสมาชิก?{' '}
            <Link to="/register" className="font-bold text-brand-blue hover:underline">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
