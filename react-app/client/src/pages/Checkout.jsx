import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api, { imageUrl } from '../api';
import { baht } from '../lib/format';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';

export default function Checkout() {
  const { user, refresh } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: user?.full_name || '', phone: '', address: '' });

  useEffect(() => {
    api.get('/cart').then(({ data }) => {
      if (!data.items.length) {
        navigate('/cart');
        return;
      }
      setItems(data.items);
      setTotal(data.total);
      setLoading(false);
    });
  }, [navigate]);

  const submit = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      text: 'เมื่อกดยืนยัน ระบบจะตัดสต็อกสินค้าและบันทึกปันผลให้คุณทันที',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0056b3',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยัน, สั่งซื้อเลย',
      cancelButtonText: 'ตรวจสอบอีกครั้ง',
      reverseButtons: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const { data } = await api.post('/orders', form);
        await refresh();
        refreshCart();
        navigate(`/thankyou/${data.order_id}`);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'สั่งซื้อไม่สำเร็จ',
          text: err.response?.data?.message || 'เกิดข้อผิดพลาด',
        });
      }
    });
  };

  if (loading) return <div className="py-24 text-center text-muted">กำลังโหลด...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link
          to="/cart"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-ink"
          aria-label="กลับไปที่ตะกร้า"
        >
          <i className="bi bi-chevron-left" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-ink">ยืนยันการสั่งซื้อ</h2>
          <p className="text-muted">อีกเพียงขั้นตอนเดียว สินค้าก็จะส่งถึงมือคุณ</p>
        </div>
      </div>

      <div className="card grid overflow-hidden md:grid-cols-5">
        <div className="border-b border-line bg-surface-2 p-6 md:col-span-2 md:border-b-0 md:border-r md:p-8">
          <div className="mb-4 flex items-center justify-between font-bold text-ink">
            <span>รายการสินค้า</span>
            <span className="rounded-full bg-surface px-3 py-1 text-sm text-brand-blue shadow-sm dark:text-accent">
              {items.length} ชิ้น
            </span>
          </div>
          <div className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-2">
            {items.map((it) => {
              const img = imageUrl(it.image);
              return (
                <div
                  key={it.item_id}
                  className="flex items-center justify-between border-b border-line pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface p-1 shadow-sm">
                      {img ? (
                        <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <i className="bi bi-image text-xl text-muted/50" />
                      )}
                    </div>
                    <div>
                      <div className="max-w-[140px] truncate font-bold text-ink">{it.name}</div>
                      <div className="text-sm text-muted">
                        {baht(it.price)} × {it.qty}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-ink">{baht(it.price * it.qty)}</div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-line pt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">ยอดชำระสุทธิ</span>
              <span className="text-3xl font-extrabold text-brand-blue dark:text-accent">
                {baht(total)}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green text-xl text-white">
                <i className="bi bi-piggy-bank" />
              </span>
              <div>
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  สิทธิประโยชน์สมาชิก
                </div>
                <div className="text-sm text-emerald-700 dark:text-emerald-400">
                  รับหุ้นสะสมทันที 10% จากยอดซื้อ
                </div>
                <div className="mt-1 font-extrabold text-emerald-800 dark:text-emerald-300">
                  + {baht(total * 0.1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6 md:col-span-3 md:p-8">
          <h5 className="font-bold text-ink">ข้อมูลการรับสินค้า</h5>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body">ชื่อ-นามสกุลสมาชิก</label>
            <input
              className="input"
              placeholder="ระบุชื่อผู้รับสินค้า"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body">เบอร์โทรศัพท์ติดต่อ</label>
            <input
              className="input"
              placeholder="เช่น 0812345678"
              pattern="[0-9]{9,10}"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body">
              ระบุวันและเวลาที่สะดวกมารับ
            </label>
            <textarea
              className="input"
              rows="4"
              placeholder="เช่น วันจันทร์ที่ 20 เวลา 10:30 น. (ที่สหกรณ์โรงเรียน)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <p className="mt-2 text-sm text-muted">
              <i className="bi bi-info-circle" /> เจ้าหน้าที่จะเตรียมสินค้าไว้รอตามเวลาที่คุณแจ้ง
            </p>
          </div>
          <button type="submit" className="btn-primary w-full py-4 text-lg">
            <i className="bi bi-shield-check" /> ยืนยันคำสั่งซื้อ
          </button>
        </form>
      </div>
    </div>
  );
}
