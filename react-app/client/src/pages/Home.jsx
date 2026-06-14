import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api, { imageUrl } from '../api';
import { baht } from '../lib/format';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="skeleton h-48 rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-7 w-24" />
        <div className="skeleton mt-2 h-11 rounded-xl" />
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const img = imageUrl(product.image);
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 ease-out-quint hover:-translate-y-1 hover:shadow-card">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-surface-2 p-5">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="max-h-full max-w-full object-contain transition duration-500 ease-out-quint group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center text-muted/60">
            <i className="bi bi-image text-5xl" />
            <div className="text-sm">ไม่มีรูปภาพ</div>
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-[1px]">
            <span className="rounded-lg border-2 border-red-400/60 px-4 py-1 text-base font-extrabold text-red-500">
              สินค้าหมด
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted shadow-sm backdrop-blur">
          {product.category_name || 'ทั่วไป'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[1.0625rem] font-bold leading-snug text-ink">
          {product.name}
        </h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-2xl font-extrabold tracking-tight text-ink">{baht(product.price)}</p>
          {product.stock > 0 ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                lowStock
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              }`}
            >
              <i className="bi bi-box-seam" />
              {lowStock ? `เหลือ ${product.stock}` : `คงเหลือ ${product.stock}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
              <i className="bi bi-x-circle" /> หมด
            </span>
          )}
        </div>

        <div className="mt-5">
          {product.stock > 0 ? (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(product.stock, Number(e.target.value))))
                }
                aria-label={`จำนวน ${product.name}`}
                className="w-16 rounded-xl border border-line bg-surface-2 p-2 text-center font-extrabold text-ink outline-none focus:border-brand-blue focus:bg-surface focus:ring-4 focus:ring-brand-blue/15"
              />
              <button onClick={() => onAdd(product, qty)} className="btn-primary flex-1">
                <i className="bi bi-cart-plus-fill" /> ใส่ตะกร้า
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-surface-2 py-3 font-bold text-muted"
            >
              <i className="bi bi-exclamation-circle-fill" /> สินค้าหมด
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/products', { params: { cat, search } });
    setProducts(data);
    setLoading(false);
  }, [cat, search]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  // Live search: debounce ค่าที่พิมพ์ก่อนยิง request
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (product, qty) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart', { product_id: product.id, qty });
      refreshCart();
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มลงตะกร้าแล้ว!',
        text: product.name,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
      {/* Hero banner */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-brand-gradient px-7 py-10 text-white md:px-12 md:py-12">
        <i className="bi bi-bag-heart pointer-events-none absolute -right-6 -bottom-6 hidden text-[11rem] leading-none text-white/10 md:block" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold">
            <i className="bi bi-shop-window" /> สหกรณ์โรงเรียนตราษตระการคุณ
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-[2.6rem]">
            ช้อปง่าย ได้ปันผล <span className="text-brand-yellow">ทุกการซื้อ</span>
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            เลือกซื้อสินค้าคุณภาพจากสหกรณ์ พร้อมสะสมหุ้นและรับเงินปันผลคืนสมาชิก
          </p>
        </div>
      </div>

      {/* Filter / search bar */}
      <div className="sticky top-[72px] z-30 mb-6 rounded-2xl border border-line bg-surface/85 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="px-1 text-lg font-extrabold tracking-tight text-ink">เลือกซื้อสินค้า</h2>
          <div className="relative flex-1 sm:ml-auto sm:max-w-xs">
            <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              aria-label="ค้นหาสินค้า"
              className="input rounded-full pl-11 pr-10"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
              >
                <i className="bi bi-x-lg text-sm" />
              </button>
            )}
          </div>
        </div>
        {/* Category chips */}
        <div role="group" aria-label="กรองตามหมวดหมู่" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCat(0)}
            aria-pressed={cat === 0}
            className={`chip whitespace-nowrap ${cat === 0 ? 'chip-active' : ''}`}
          >
            <i className="bi bi-grid" /> ทุกหมวดหมู่
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={`chip whitespace-nowrap ${cat === c.id ? 'chip-active' : ''}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length ? (
        <>
          <p className="mb-4 px-1 text-sm text-muted">
            พบ <span className="font-bold text-ink">{products.length}</span> รายการ
            {search && (
              <>
                {' '}
                สำหรับ “<span className="font-semibold text-ink">{search}</span>”
              </>
            )}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-line bg-surface py-24 text-center">
          <i className="bi bi-search text-6xl text-muted/50" />
          <h3 className="mt-3 text-xl font-bold text-ink">ไม่พบสินค้า</h3>
          <p className="text-muted">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
          {(search || cat !== 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setCat(0);
              }}
              className="btn-secondary mt-5"
            >
              <i className="bi bi-arrow-counterclockwise" /> ล้างตัวกรอง
            </button>
          )}
        </div>
      )}
    </div>
  );
}
