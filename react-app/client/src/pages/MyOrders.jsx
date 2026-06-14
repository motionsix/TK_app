import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { imageUrl } from '../api';
import { baht, formatDate } from '../lib/format';
import { orderStatus } from '../lib/orderStatus';

function DetailModal({ orderId, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get(`/orders/${orderId}/items`).then((r) => setData(r.data));
  }, [orderId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-6 py-4">
          <h5 className="font-bold text-ink">
            <i className="bi bi-file-earmark-text text-brand-blue dark:text-accent" /> รายละเอียดคำสั่งซื้อ #
            {String(orderId).padStart(5, '0')}
          </h5>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="p-6">
          {!data ? (
            <div className="py-10 text-center text-muted">กำลังดึงข้อมูล...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="bg-surface-2 text-xs text-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold">สินค้า</th>
                    <th className="p-3 text-center font-semibold">ราคา/หน่วย</th>
                    <th className="p-3 text-center font-semibold">จำนวน</th>
                    <th className="p-3 text-right font-semibold">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it) => {
                    const img = imageUrl(it.image);
                    return (
                      <tr key={it.id} className="border-b border-line">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {img && (
                              <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                            )}
                            <span className="font-bold text-ink">{it.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-muted">{baht(it.price)}</td>
                        <td className="p-3 text-center text-body">{it.qty}</td>
                        <td className="p-3 text-right font-bold text-brand-blue dark:text-accent">
                          {baht(it.price * it.qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-2">
                    <td colSpan="3" className="p-3 text-right font-bold text-ink">
                      ยอดรวมสุทธิ:
                    </td>
                    <td className="p-3 text-right text-lg font-extrabold text-brand-blue dark:text-accent">
                      {baht(data.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then((r) => {
      setOrders(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-24 text-center text-muted">กำลังโหลด...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink">
          <i className="bi bi-box-seam text-brand-blue dark:text-accent" /> ประวัติคำสั่งซื้อของฉัน
        </h2>
        <span className="text-sm text-muted">ทั้งหมด {orders.length} รายการ</span>
      </div>

      {orders.length === 0 ? (
        <div className="card py-20 text-center">
          <i className="bi bi-cart-x text-6xl text-muted/40" />
          <p className="mt-3 text-muted">คุณยังไม่มีประวัติการสั่งซื้อ</p>
          <Link to="/" className="btn-primary mt-4">
            <i className="bi bi-bag" /> ไปช้อปปิ้งกันเลย
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const status = orderStatus(o.status);
            return (
              <div
                key={o.id}
                className="card grid grid-cols-2 items-center gap-4 p-5 transition hover:shadow-soft md:grid-cols-5"
              >
                <div>
                  <div className="text-xs text-muted">เลขที่คำสั่งซื้อ</div>
                  <div className="font-bold text-brand-blue dark:text-accent">
                    #{String(o.id).padStart(5, '0')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">วันที่สั่งซื้อ</div>
                  <div className="text-sm text-body">
                    <i className="bi bi-calendar3" /> {formatDate(o.created_at)}
                  </div>
                </div>
                <div className="md:text-center">
                  <div className="text-xs text-muted">ยอดรวมสุทธิ</div>
                  <div className="text-lg font-extrabold text-ink">{baht(o.total_price)}</div>
                </div>
                <div className="md:text-center">
                  <div className="text-xs text-muted">สถานะ</div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
                  >
                    <i className={`bi ${status.icon}`} /> {status.text}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-1 md:text-right">
                  <button onClick={() => setOpenId(o.id)} className="btn-secondary w-full">
                    <i className="bi bi-search" /> รายละเอียด
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openId && <DetailModal orderId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
