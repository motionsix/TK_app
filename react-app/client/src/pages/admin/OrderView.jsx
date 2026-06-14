import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { baht, formatDate } from '../../lib/format';

export default function AdminOrderView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/admin/orders/${id}`)
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  }, [id]);

  if (error)
    return (
      <div className="p-10 text-center">
        <h3 className="text-xl font-bold text-ink">ไม่พบข้อมูล</h3>
        <Link to="/admin/orders" className="btn-primary mt-4">
          กลับหน้ารายการ
        </Link>
      </div>
    );
  if (!data) return <div className="p-10 text-center text-muted">กำลังโหลด...</div>;

  const { order, items } = data;

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link to="/admin/orders" className="btn-secondary">
          <i className="bi bi-arrow-left" /> กลับไปหน้ารายการ
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          <i className="bi bi-printer" /> พิมพ์ใบเสร็จ
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h5 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <i className="bi bi-box-seam text-brand-blue dark:text-accent" /> รายการใน Order #
              {order.id}
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead className="bg-surface-2 text-sm text-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold">สินค้า</th>
                    <th className="p-3 text-center font-semibold">จำนวน</th>
                    <th className="p-3 text-right font-semibold">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-line">
                      <td className="p-3 text-body">{it.product_name}</td>
                      <td className="p-3 text-center text-body">{it.qty}</td>
                      <td className="p-3 text-right font-bold text-ink">{baht(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <td colSpan="2" className="p-3 text-right font-bold text-ink">
                      ยอดรวม:
                    </td>
                    <td className="p-3 text-right text-xl font-extrabold text-brand-blue dark:text-accent">
                      {baht(order.total_price)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-6">
            <h6 className="mb-3 text-xs font-bold tracking-wide text-muted">ข้อมูลผู้ซื้อ</h6>
            <dl className="space-y-1.5 text-body">
              <div className="flex gap-2">
                <dt className="font-bold text-ink">ชื่อ:</dt>
                <dd>{order.full_name || order.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold text-ink">User:</dt>
                <dd>@{order.username}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold text-ink">โทร:</dt>
                <dd>{order.phone}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold text-ink">เวลารับ:</dt>
                <dd>{order.address}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
