import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../api';

export default function AdminLoyverse() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');

  const loadStatus = () => api.get('/admin/loyverse/status').then((r) => setStatus(r.data));

  useEffect(() => {
    loadStatus();
  }, []);

  const runSync = async (kind) => {
    setBusy(kind);
    try {
      const { data } = await api.post(`/admin/loyverse/sync-${kind}`);
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: data.message });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: err.response?.data?.message || 'ซิงค์ไม่สำเร็จ',
      });
    } finally {
      setBusy('');
    }
  };

  const linkAdmin = async () => {
    const { value: password, isConfirmed } = await Swal.fire({
      title: 'ผูกบัญชีแอดมินกับเจ้าของร้าน Loyverse',
      input: 'password',
      inputLabel: 'ตั้งรหัสผ่านสำหรับบัญชีแอดมินนี้ (เว้นว่างเพื่อใช้ค่าเริ่มต้น)',
      inputPlaceholder: 'เว้นว่าง = owner123',
      showCancelButton: true,
      confirmButtonText: 'ผูกบัญชี',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;

    setBusy('admin');
    try {
      const { data } = await api.post('/admin/loyverse/link-admin', { password: password || '' });
      const credLine = data.created
        ? `เข้าสู่ระบบด้วยอีเมล <b>${data.email}</b> รหัสผ่าน <b>${data.initialPassword}</b>`
        : `เข้าสู่ระบบด้วยอีเมล <b>${data.email}</b>${
            data.passwordChanged ? ' (อัปเดตรหัสผ่านแล้ว)' : ' (รหัสผ่านเดิมของบัญชีนี้)'
          }`;
      Swal.fire({ icon: 'success', title: 'สำเร็จ', html: `${data.message}<br/><br/>${credLine}` });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: err.response?.data?.message || 'ผูกบัญชีไม่สำเร็จ',
      });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold text-ink">
          <i className="bi bi-arrow-repeat text-brand-blue dark:text-accent" /> เชื่อมต่อ Loyverse POS
        </h2>
        <p className="text-muted">ดึงสินค้า/สต็อก และซิงค์ลูกค้าจากระบบ POS Loyverse</p>
      </div>

      {/* Connection status */}
      <div className="card mb-6 p-6">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-ink">สถานะการเชื่อมต่อ</h5>
          <button
            onClick={loadStatus}
            className="text-sm font-semibold text-brand-blue transition hover:underline dark:text-accent"
          >
            <i className="bi bi-arrow-clockwise" /> รีเฟรช
          </button>
        </div>
        <div className="mt-4">
          {!status ? (
            <span className="text-muted">กำลังตรวจสอบ...</span>
          ) : !status.configured ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <i className="bi bi-exclamation-triangle-fill" /> ยังไม่ได้ตั้งค่า Token
            </span>
          ) : status.connected ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <i className="bi bi-check-circle-fill" /> เชื่อมต่อสำเร็จ — {status.business}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <i className="bi bi-x-circle-fill" /> เชื่อมต่อไม่ได้: {status.message}
            </span>
          )}
        </div>
      </div>

      {/* Setup guide (shown when no token) */}
      {status && !status.configured && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-500/30 dark:bg-blue-500/10">
          <h5 className="mb-3 font-bold text-blue-900 dark:text-blue-200">วิธีสร้าง Access Token</h5>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-900/80 dark:text-blue-200/80">
            <li>เข้า Loyverse Back Office → เมนู Settings → Access Tokens</li>
            <li>กด “+ Add access token” ตั้งชื่อแล้วบันทึก</li>
            <li>คัดลอก token (แสดงครั้งเดียว)</li>
            <li>
              วางลงไฟล์{' '}
              <code className="rounded bg-surface px-1">react-app/server/.env</code> ที่บรรทัด{' '}
              <code className="rounded bg-surface px-1">LOYVERSE_TOKEN=</code>
            </li>
            <li>รีสตาร์ท server แล้วกดรีเฟรชสถานะ</li>
          </ol>
        </div>
      )}

      {/* Sync actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-6">
          <div className="mb-2 flex items-center gap-3">
            <i className="bi bi-box-seam text-2xl text-brand-blue dark:text-accent" />
            <h5 className="font-bold text-ink">ซิงค์สินค้า + สต็อก</h5>
          </div>
          <p className="mb-4 text-sm text-muted">
            ดึง items, หมวดหมู่ และจำนวนสต็อกจาก Loyverse มาอัปเดตในร้าน (รันซ้ำได้ จะอัปเดตของเดิม)
          </p>
          <button
            onClick={() => runSync('products')}
            disabled={!status?.connected || busy}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy === 'products' ? 'กำลังซิงค์...' : 'เริ่มซิงค์สินค้า'}
          </button>
        </div>

        <div className="card p-6">
          <div className="mb-2 flex items-center gap-3">
            <i className="bi bi-people text-2xl text-brand-green" />
            <h5 className="font-bold text-ink">ซิงค์ลูกค้า → สมาชิก</h5>
          </div>
          <p className="mb-3 text-sm text-muted">
            ดึงรายชื่อลูกค้า (customers) จาก Loyverse มาสร้างเป็นสมาชิกสหกรณ์ (รันซ้ำได้)
          </p>
          <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <i className="bi bi-key-fill" /> ลูกค้าใหม่ล็อกอินด้วย <b>เบอร์โทร</b>{' '}
            เป็นทั้งชื่อผู้ใช้และรหัสผ่านเริ่มต้น (แนะนำให้เปลี่ยนรหัสภายหลัง)
          </p>
          <button
            onClick={() => runSync('customers')}
            disabled={!status?.connected || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 font-bold text-white shadow-glow shadow-emerald-500/30 transition duration-200 ease-out-quint hover:-translate-y-0.5 hover:bg-emerald-600 disabled:translate-y-0 disabled:opacity-50"
          >
            {busy === 'customers' ? 'กำลังซิงค์...' : 'เริ่มซิงค์ลูกค้า'}
          </button>
        </div>

        <div className="card p-6">
          <div className="mb-2 flex items-center gap-3">
            <i className="bi bi-shield-lock text-2xl text-brand-blue dark:text-accent" />
            <h5 className="font-bold text-ink">ผูกแอดมินกับเจ้าของร้าน</h5>
          </div>
          <p className="mb-4 text-sm text-muted">
            สร้าง/ผูกบัญชีแอดมินจาก<b>อีเมลเจ้าของร้าน Loyverse</b>{' '}
            เพื่อให้เจ้าของร้านล็อกอินจัดการระบบได้
          </p>
          <button
            onClick={linkAdmin}
            disabled={!status?.connected || busy}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy === 'admin' ? 'กำลังผูกบัญชี...' : 'ผูกบัญชีเจ้าของร้าน'}
          </button>
        </div>
      </div>
    </div>
  );
}
