import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api, { imageUrl } from '../api';
import { baht } from '../lib/format';
import { useCart } from '../cart/CartContext';

export default function Cart() {
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/cart');
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateQty = async (item, qty) => {
    const newQty = Math.max(1, qty);
    await api.put(`/cart/${item.item_id}`, { qty: newQty });
    await load();
    refreshCart();
  };

  const removeItem = (item) => {
    Swal.fire({
      title: 'ลบสินค้า?',
      text: 'คุณต้องการนำสินค้าชิ้นนี้ออกจากตะกร้าใช่ไหม?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.delete(`/cart/${item.item_id}`);
        await load();
        refreshCart();
      }
    });
  };

  if (loading) return <div className="py-24 text-center text-muted">กำลังโหลด...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-2xl text-white">
          <i className="bi bi-cart3" />
        </span>
        <div>
          <h2 className="text-2xl font-extrabold text-ink">ตะกร้าของคุณ</h2>
          <p className="text-muted">ตรวจสอบและยืนยันรายการสินค้าก่อนชำระเงิน</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card py-24 text-center">
          <i className="bi bi-cart-x text-7xl text-muted/40" />
          <h3 className="mt-4 text-xl font-bold text-ink">ยังไม่มีสินค้าในตะกร้า</h3>
          <p className="mb-6 text-muted">ออกไปเลือกชมสินค้าคุณภาพจากสหกรณ์กันเถอะครับ!</p>
          <Link to="/" className="btn-primary">
            <i className="bi bi-bag" /> เริ่มช้อปปิ้งกันเลย
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-surface-2 text-xs tracking-wide text-muted">
                <tr>
                  <th className="p-5 text-left font-semibold">รายการสินค้า</th>
                  <th className="p-5 text-center font-semibold">ราคา</th>
                  <th className="p-5 text-center font-semibold">จำนวน</th>
                  <th className="p-5 text-center font-semibold">รวม</th>
                  <th className="p-5 text-center font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const img = imageUrl(it.image);
                  return (
                    <tr key={it.item_id} className="border-t border-line">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-line bg-surface-2 p-1">
                            {img ? (
                              <img
                                src={img}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <i className="bi bi-image text-2xl text-muted/50" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-ink">{it.name}</div>
                            <span className="text-xs text-muted">
                              ID: #{String(it.product_id).padStart(4, '0')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-body">{baht(it.price)}</td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={(e) => updateQty(it, Number(e.target.value))}
                          aria-label={`จำนวน ${it.name}`}
                          className="w-16 rounded-xl border border-line bg-surface-2 p-2 text-center font-extrabold text-ink outline-none focus:border-brand-blue focus:bg-surface focus:ring-4 focus:ring-brand-blue/15"
                        />
                      </td>
                      <td className="p-4 text-center text-lg font-extrabold text-ink">
                        {baht(it.price * it.qty)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => removeItem(it)}
                          aria-label={`ลบ ${it.name} ออกจากตะกร้า`}
                          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/25"
                        >
                          <i className="bi bi-trash3-fill" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-line bg-surface-2 p-6 md:flex-row md:p-8">
            <Link to="/" className="font-bold text-muted transition hover:text-ink">
              <i className="bi bi-chevron-left" /> เลือกสินค้าเพิ่ม
            </Link>
            <div className="text-right">
              <div className="text-xs font-bold text-muted">ยอดชำระสุทธิ</div>
              <div className="text-4xl font-extrabold leading-none text-brand-blue dark:text-accent">
                {baht(total)}
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary px-10">
              ชำระเงินสินค้า <i className="bi bi-arrow-right-short text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
