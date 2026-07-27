import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      await Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ!',
        text: 'ยินดีต้อนรับเข้าสู่ระบบ กำลังพาคุณไปหน้าล็อกอิน...',
        timer: 2200,
        showConfirmButton: false,
        timerProgressBar: true,
      });
      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถสมัครสมาชิกได้',
        confirmButtonColor: '#16a34a',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md overflow-hidden shadow-card">
        <div className="bg-gradient-to-r from-brand-green to-emerald-600 px-8 py-8 text-center text-white sm:px-10">
          <img
            src="/logo.png"
            alt="โลโก้โรงเรียนตราษตระการคุณ"
            className="mx-auto mb-3 h-20 w-20 object-contain drop-shadow"
          />
          <h2 className="text-2xl font-extrabold text-white">สมัครสมาชิก</h2>
          <p className="text-sm text-white/85">เข้าร่วมเป็นสมาชิก TK EASY STORE</p>
        </div>

        <div className="p-8 sm:p-10">
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <i className="bi bi-person-badge absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-11 focus:border-brand-green focus:ring-brand-green/15"
                placeholder="ชื่อ-นามสกุล"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="relative">
              <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-11 focus:border-brand-green focus:ring-brand-green/15"
                placeholder="ชื่อผู้ใช้ (Username)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="relative">
              <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                className="input pl-11 focus:border-brand-green focus:ring-brand-green/15"
                placeholder="รหัสผ่าน (Password)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 font-bold text-white shadow-glow shadow-emerald-500/30 transition duration-200 ease-out-quint hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:translate-y-0 disabled:opacity-50"
            >
              {submitting ? 'กำลังสมัคร...' : 'ยืนยันการสมัคร'}{' '}
              <i className="bi bi-check-circle-fill" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            เป็นสมาชิกอยู่แล้ว?{' '}
            <Link to="/login" className="font-bold text-brand-green hover:underline">
              เข้าสู่ระบบเลย
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
