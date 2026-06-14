import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../../api';
import { baht } from '../../lib/format';

function EditModal({ member, onClose, onSaved }) {
  const [share, setShare] = useState(member.share_amount);
  const [months, setMonths] = useState(member.months_held);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/members/${member.id}`, { share_amount: share, months_held: months });
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'อัปเดตข้อมูลหุ้นเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      onSaved();
      onClose();
    } catch (err) {
      Swal.fire('ผิดพลาด', err.response?.data?.message || 'อัปเดตไม่สำเร็จ', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-brand-blue p-5 text-white">
          <h5 className="font-bold">
            <i className="bi bi-pencil-square" /> ปรับปรุงข้อมูลหุ้น
          </h5>
          <button type="button" onClick={onClose} aria-label="ปิด" className="hover:opacity-80">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="text-sm font-semibold text-body">ชื่อสมาชิก</label>
            <input className="input mt-1" value={member.name} readOnly />
          </div>
          <div>
            <label className="text-sm font-semibold text-body">ยอดหุ้นสะสม (บาท)</label>
            <input
              type="number"
              step="0.01"
              className="input mt-1"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-body">ระยะเวลาถือครอง</label>
            <select
              className="input mt-1"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m} เดือน
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full py-3">
            <i className="bi bi-check-circle" /> บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDividend() {
  const [data, setData] = useState({
    members: [],
    totals: { shares: 0, purchase: 0, dividend: 0 },
    ratePercent: 6,
    purchaseRatePercent: 3,
  });
  const [rate, setRate] = useState(6);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/admin/members', { params: { rate, search } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [rate, search]);

  // Live search: debounce ก่อนยิง request
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink">
            <i className="bi bi-cash-coin text-brand-green" /> สรุปรายงานปันผลรวม
          </h2>
          <p className="text-muted">
            ปันผลหุ้น {data.ratePercent}% | ปันผลยอดซื้อ {data.purchaseRatePercent}%
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary">
          <i className="bi bi-file-earmark-pdf" /> พิมพ์รายงานทางการ
        </button>
      </div>

      <div className="mb-8 hidden text-center text-ink print:block">
        <h3 className="text-xl font-bold">รายงานสรุปการจัดสรรเงินปันผลสมาชิก</h3>
        <p>สหกรณ์ร้านค้าโรงเรียนตราษตระการคุณ</p>
        <p>ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-3">
        <div className="card p-6">
          <h6 className="text-xs font-bold tracking-wide text-muted">ยอดหุ้นรวม</h6>
          <h2 className="text-3xl font-extrabold text-ink">{baht(data.totals.shares)}</h2>
        </div>
        <div className="card p-6">
          <h6 className="text-xs font-bold tracking-wide text-muted">ยอดซื้อรวม</h6>
          <h2 className="text-3xl font-extrabold text-ink">{baht(data.totals.purchase)}</h2>
        </div>
        <div className="card p-6">
          <h6 className="text-xs font-bold tracking-wide text-muted">ยอดปันผลจ่ายรวม</h6>
          <h2 className="text-3xl font-extrabold text-brand-green">{baht(data.totals.dividend)}</h2>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 print:hidden">
        <div className="relative min-w-[200px] flex-1">
          <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input rounded-full pl-11 pr-10"
            placeholder="ค้นหาชื่อสมาชิก..."
            aria-label="ค้นหาชื่อสมาชิก"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <i className="bi bi-x-lg text-sm" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <label className="leading-tight">
            <span className="block text-xs font-bold tracking-wide text-muted">เรทปันผลหุ้น %</span>
            <input
              type="number"
              step="0.1"
              className="w-20 bg-transparent text-xl font-extrabold text-ink outline-none"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <button onClick={load} className="btn-primary py-2">
            <i className="bi bi-arrow-repeat" /> ปรับปรุง
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px]">
          <thead className="bg-surface-2 text-center text-sm text-muted">
            <tr>
              <th className="p-3 font-semibold">#</th>
              <th className="p-3 text-left font-semibold">สมาชิก</th>
              <th className="p-3 text-right font-semibold">ทุนหุ้น</th>
              <th className="p-3 text-right font-semibold">ยอดซื้อ</th>
              <th className="p-3 text-right font-semibold">รวมปันผลสุทธิ</th>
              <th className="p-3 text-center font-semibold print:hidden">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-line">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="p-3">
                      <div className="skeleton h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.members.map((m, i) => (
                <tr key={m.id} className="border-t border-line transition hover:bg-surface-2/60">
                  <td className="p-3 text-center text-muted">{i + 1}</td>
                  <td className="p-3 font-bold text-ink">{m.name}</td>
                  <td className="p-3 text-right text-body">{baht(m.share_amount)}</td>
                  <td className="p-3 text-right text-body">{baht(m.total_buy)}</td>
                  <td className="p-3 text-right font-extrabold text-brand-green">
                    {baht(m.dividend)}
                  </td>
                  <td className="p-3 text-center print:hidden">
                    <button
                      onClick={() => setEditing(m)}
                      className="rounded-full border border-brand-blue px-3 py-1 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white dark:border-accent dark:text-accent dark:hover:bg-accent dark:hover:text-slate-900"
                    >
                      แก้ไขข้อมูล
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && data.members.length === 0 && (
          <div className="py-12 text-center text-muted">ไม่พบสมาชิก</div>
        )}
      </div>

      {editing && <EditModal member={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
