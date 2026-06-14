import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api';
import { baht } from '../../lib/format';
import { orderStatus } from '../../lib/orderStatus';

const isPending = (status) => {
  const st = (status || '').trim().toLowerCase();
  return st !== 'approved' && st !== 'rejected';
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api.get('/admin/orders').then((r) => {
      setOrders(r.data);
      setSelected(new Set());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingIds = orders.filter((o) => isPending(o.status)).map((o) => o.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(pendingIds));
  };

  const changeStatus = (id, action) => {
    Swal.fire({
      title: 'ยืนยันรายการ?',
      text: 'คุณต้องการเปลี่ยนสถานะรายการนี้ใช่หรือไม่',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'ใช่, ดำเนินการเลย',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.post(`/admin/orders/${id}/status`, { action });
        await load();
        Swal.fire({ icon: 'success', title: 'สำเร็จ', timer: 1000, showConfirmButton: false });
      }
    });
  };

  const bulkAction = (action) => {
    const ids = [...selected];
    if (!ids.length) return;
    const isApprove = action === 'received';
    Swal.fire({
      title: isApprove ? `อนุมัติ ${ids.length} รายการ?` : `ยกเลิก ${ids.length} รายการ?`,
      text: isApprove ? 'ระบบจะยืนยันรับสินค้าทุกรายการที่เลือก' : 'ระบบจะยกเลิกทุกรายการที่เลือก',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      confirmButtonText: isApprove ? 'อนุมัติทั้งหมด' : 'ยกเลิกทั้งหมด',
      cancelButtonText: 'ปิด',
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      setBusy(true);
      try {
        for (const id of ids) {
          await api.post(`/admin/orders/${id}/status`, { action });
        }
        await load();
        Swal.fire({
          icon: 'success',
          title: `ดำเนินการ ${ids.length} รายการแล้ว`,
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('ผิดพลาด', err.response?.data?.message || 'ดำเนินการบางรายการไม่สำเร็จ', 'error');
        await load();
      } finally {
        setBusy(false);
      }
    });
  };

  const remove = (id) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'ข้อมูลจะถูกลบออกจากระบบถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.delete(`/admin/orders/${id}`);
        await load();
        Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1000, showConfirmButton: false });
      }
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <h2 className="mb-1 flex items-center gap-2.5 text-2xl font-extrabold text-ink">
        <i className="bi bi-receipt-cutoff text-brand-blue dark:text-accent" /> รายการสั่งซื้อทั้งหมด
      </h2>
      <p className="mb-6 text-muted">จัดการและตรวจสอบสถานะคำสั่งซื้อ</p>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-blue/30 bg-brand-blue/5 p-3 dark:bg-brand-blue/10">
          <span className="px-2 font-bold text-brand-blue dark:text-accent">
            เลือก {selected.size} รายการ
          </span>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <button onClick={() => bulkAction('received')} disabled={busy} className="btn-primary py-2">
              <i className="bi bi-check2-all" /> อนุมัติที่เลือก
            </button>
            <button
              onClick={() => bulkAction('cancel')}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-surface px-5 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <i className="bi bi-x-circle" /> ยกเลิกที่เลือก
            </button>
            <button onClick={() => setSelected(new Set())} className="btn-secondary py-2">
              ล้างการเลือก
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px]">
          <thead className="bg-surface-2 text-xs tracking-wide text-muted">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={pendingIds.length === 0}
                  aria-label="เลือกทั้งหมดที่รอดำเนินการ"
                  className="h-4 w-4 cursor-pointer accent-brand-blue"
                />
              </th>
              <th className="p-4 text-left font-semibold">รหัส</th>
              <th className="p-4 text-left font-semibold">ผู้สั่ง</th>
              <th className="p-4 text-center font-semibold">ยอดรวม</th>
              <th className="p-4 text-center font-semibold">สถานะ</th>
              <th className="p-4 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="p-4"><div className="skeleton h-4 w-4" /></td>
                  <td className="p-4"><div className="skeleton h-4 w-10" /></td>
                  <td className="p-4"><div className="skeleton h-4 w-32" /></td>
                  <td className="p-4"><div className="skeleton mx-auto h-4 w-16" /></td>
                  <td className="p-4"><div className="skeleton mx-auto h-6 w-20 rounded-full" /></td>
                  <td className="p-4"><div className="skeleton ml-auto h-8 w-24" /></td>
                </tr>
              ))
            ) : (
              orders.map((o) => {
                const status = orderStatus(o.status);
                const pending = isPending(o.status);
                return (
                  <tr key={o.id} className="border-t border-line transition hover:bg-surface-2/60">
                    <td className="p-4">
                      {pending && (
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggle(o.id)}
                          aria-label={`เลือกคำสั่งซื้อ #${o.id}`}
                          className="h-4 w-4 cursor-pointer accent-brand-blue"
                        />
                      )}
                    </td>
                    <td className="p-4 font-bold text-ink">#{o.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{o.name}</div>
                      <div className="text-sm text-muted">@{o.username}</div>
                    </td>
                    <td className="p-4 text-center font-bold text-brand-blue dark:text-accent">
                      {baht(o.total_price)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
                      >
                        <i className={`bi ${status.icon}`} /> {status.text}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-body transition hover:bg-line"
                          title="ดูรายละเอียด"
                          aria-label={`ดูรายละเอียดคำสั่งซื้อ #${o.id}`}
                        >
                          <i className="bi bi-eye" />
                        </Link>
                        {pending && (
                          <>
                            <button
                              onClick={() => changeStatus(o.id, 'received')}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green text-white transition hover:bg-emerald-600"
                              title="ยืนยันรับสินค้า"
                              aria-label={`อนุมัติคำสั่งซื้อ #${o.id}`}
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                            <button
                              onClick={() => changeStatus(o.id, 'cancel')}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
                              title="ยกเลิก"
                              aria-label={`ยกเลิกคำสั่งซื้อ #${o.id}`}
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => remove(o.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted transition hover:bg-line hover:text-red-500"
                          title="ลบ"
                          aria-label={`ลบคำสั่งซื้อ #${o.id}`}
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <div className="py-16 text-center text-muted">ยังไม่มีคำสั่งซื้อ</div>
        )}
      </div>
    </div>
  );
}
