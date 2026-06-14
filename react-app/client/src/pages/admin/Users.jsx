import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../../api';
import { baht, formatDate } from '../../lib/format';

const roleClass = {
  admin: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  teacher: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  student: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
};

function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('csv_file', file);
      const { data } = await api.post('/admin/users/import', fd);
      Swal.fire('สำเร็จ', data.message, 'success');
      onDone();
      onClose();
    } catch (err) {
      Swal.fire('ผิดพลาด', err.response?.data?.message || 'นำเข้าไม่สำเร็จ', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-3 font-bold text-ink">นำเข้าสมาชิกจาก CSV</h5>
        <p className="mb-3 text-sm text-muted">
          เรียงคอลัมน์:{' '}
          <code className="rounded bg-surface-2 px-1 text-body">
            Username, Password, Full_Name, Role, Share_Amount
          </code>{' '}
          (แถวแรกเป็นหัวตาราง)
        </p>
        <input
          type="file"
          accept=".csv"
          className="input-file mb-4"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            ยกเลิก
          </button>
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 font-bold text-white shadow-glow shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {busy ? 'กำลังนำเข้า...' : 'เริ่มนำเข้าข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/admin/users')
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const removeUser = (id, name) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณกำลังจะลบสมาชิก ${name} และข้อมูลหุ้นทั้งหมด!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.delete(`/admin/users/${id}`);
        load();
      }
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
            <i className="bi bi-people-fill text-brand-blue dark:text-accent" /> จัดการสมาชิก
          </h2>
          <p className="text-muted">รายชื่อผู้ใช้งานและสมาชิกสหกรณ์ทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 font-bold text-white shadow-glow shadow-emerald-500/30 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/25"
        >
          <i className="bi bi-file-earmark-excel" /> นำเข้าข้อมูล (CSV)
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[680px]">
          <thead className="bg-surface-2 text-sm text-muted">
            <tr>
              <th className="p-4 text-left font-semibold">ชื่อ-นามสกุล</th>
              <th className="p-4 text-left font-semibold">Username</th>
              <th className="p-4 text-left font-semibold">บทบาท</th>
              <th className="p-4 text-left font-semibold">หุ้นสะสม</th>
              <th className="p-4 text-left font-semibold">วันที่สมัคร</th>
              <th className="p-4 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`s${i}`} className="border-t border-line">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="skeleton h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              users.map((u) => (
                <tr key={u.u_id} className="border-t border-line transition hover:bg-surface-2/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 font-bold text-body">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-ink">{u.full_name || 'ไม่ระบุชื่อ'}</div>
                        <small className="text-muted">User ID: #{u.u_id}</small>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-brand-blue dark:text-accent">{u.username}</code>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        roleClass[u.role] || roleClass.student
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-ink">{baht(u.share_amount ?? 0)}</td>
                  <td className="p-4 text-sm text-muted">
                    <i className="bi bi-calendar-event" /> {formatDate(u.created_at)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => removeUser(u.u_id, u.username)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted transition hover:bg-line hover:text-red-500"
                      aria-label={`ลบสมาชิก ${u.full_name || u.username}`}
                      title="ลบสมาชิก"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="py-16 text-center text-muted">ยังไม่มีสมาชิกในระบบ</div>
        )}
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={load} />}
    </div>
  );
}
