import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import api, { imageUrl } from '../../api';
import { baht } from '../../lib/format';

const emptyProduct = { name: '', category: '', price: '', stock: '', description: '' };

function ProductForm({ cats, onSaved }) {
  const [form, setForm] = useState(emptyProduct);
  const [file, setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    await api.post('/admin/products', fd);
    setForm(emptyProduct);
    setFile(null);
    e.target.reset();
    Swal.fire({
      icon: 'success',
      title: 'บันทึกสินค้าใหม่แล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-6">
      <h5 className="mb-2 flex items-center gap-2 font-extrabold text-ink">
        <i className="bi bi-plus-circle-fill text-brand-green" /> เพิ่มสินค้าใหม่
      </h5>
      <input
        className="input"
        placeholder="ชื่อสินค้า"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <select
        className="input"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        <option value="">-- เลือกหมวดหมู่ --</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="0.01"
          className="input"
          placeholder="ราคา (฿)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          type="number"
          className="input"
          placeholder="สต็อก"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />
      </div>
      <textarea
        className="input"
        rows="2"
        placeholder="คำอธิบายสินค้า"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        type="file"
        accept="image/*"
        className="input-file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button className="btn-primary w-full">บันทึกสินค้าใหม่</button>
    </form>
  );
}

function CategoryManager({ cats, onChange }) {
  const [name, setName] = useState('');

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/admin/categories', { name });
    setName('');
    onChange();
  };

  const remove = (id) => {
    Swal.fire({
      title: 'ลบหมวดหมู่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.delete(`/admin/categories/${id}`);
        onChange();
      }
    });
  };

  return (
    <div className="card p-6">
      <h5 className="mb-4 flex items-center gap-2 font-extrabold text-ink">
        <i className="bi bi-tags text-brand-blue dark:text-accent" /> จัดการหมวดหมู่
      </h5>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          className="input"
          placeholder="เพิ่มหมวดหมู่ใหม่..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          aria-label="เพิ่มหมวดหมู่"
          className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white shadow-glow transition hover:bg-brand-dark"
        >
          <i className="bi bi-plus-lg" />
        </button>
      </form>
      <div className="max-h-72 divide-y divide-line overflow-y-auto">
        {cats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีหมวดหมู่</p>
        ) : (
          cats.map((c) => (
            <div key={c.id} className="group flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold tabular-nums text-muted">
                  {c.id}
                </span>
                <span className="font-semibold text-ink">{c.name}</span>
              </div>
              <button
                onClick={() => remove(c.id)}
                aria-label={`ลบหมวดหมู่ ${c.name}`}
                title="ลบ"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted/60 transition hover:bg-surface-2 hover:text-red-500"
              >
                <i className="bi bi-trash3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditModal({ product, cats, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price,
    stock: product.stock,
    category: product.category_id || '',
  });
  const [file, setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    await api.put(`/admin/products/${product.id}`, fd);
    Swal.fire({
      icon: 'success',
      title: 'บันทึกการแก้ไขแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-ink">แก้ไขข้อมูลสินค้า</h5>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <textarea
          className="input"
          rows="2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            type="number"
            className="input"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
        </div>
        <select
          className="input"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">-- ไม่ระบุ --</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept="image/*"
          className="input-file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            ยกเลิก
          </button>
          <button className="btn-primary">บันทึกการแก้ไข</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCats = useCallback(() => api.get('/categories').then((r) => setCats(r.data)), []);
  const loadProducts = useCallback(() => {
    setLoading(true);
    return api
      .get('/products')
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCats();
    loadProducts();
  }, [loadCats, loadProducts]);

  const removeProduct = (id) => {
    Swal.fire({
      title: 'ลบสินค้านี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    }).then(async (r) => {
      if (r.isConfirmed) {
        await api.delete(`/admin/products/${id}`);
        loadProducts();
      }
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold text-ink">
          <i className="bi bi-box-seam-fill text-brand-blue dark:text-accent" /> จัดการคลังสินค้า
        </h2>
        <p className="text-muted">เพิ่ม ลบ แก้ไข และควบคุมสต็อกสินค้าสหกรณ์</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <ProductForm cats={cats} onSaved={loadProducts} />
          <CategoryManager
            cats={cats}
            onChange={() => {
              loadCats();
              loadProducts();
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6">
            <h5 className="mb-4 flex items-center gap-2 font-extrabold text-ink">
              <i className="bi bi-grid-3x3-gap-fill text-brand-blue dark:text-accent" /> สินค้าทั้งหมด (
              {products.length})
            </h5>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-line">
                    <div className="skeleton h-40 rounded-none" />
                    <div className="space-y-2 p-3">
                      <div className="skeleton h-3 w-16" />
                      <div className="skeleton h-4 w-4/5" />
                      <div className="skeleton h-5 w-20" />
                      <div className="skeleton h-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-muted">ยังไม่มีสินค้าในคลัง</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => {
                  const img = imageUrl(p.image);
                  return (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-line transition hover:shadow-soft"
                    >
                      <div className="relative flex h-40 items-center justify-center bg-surface-2 p-4">
                        {img ? (
                          <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <i className="bi bi-image text-4xl text-muted/40" />
                        )}
                        <span
                          className={`absolute right-3 top-3 rounded-lg px-2 py-1 text-[11px] font-extrabold text-white ${
                            p.stock > 10 ? 'bg-brand-green' : 'bg-red-500'
                          }`}
                        >
                          สต็อก: {p.stock}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
                          {p.category_name || 'ทั่วไป'}
                        </span>
                        <h6 className="mt-1 truncate font-bold text-ink">{p.name}</h6>
                        <h5 className="mb-3 font-extrabold text-brand-blue dark:text-accent">
                          {baht(p.price)}
                        </h5>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(p)}
                            className="flex-1 rounded-full border border-line py-1.5 text-sm font-bold text-body transition hover:bg-surface-2"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="flex-1 rounded-full border border-red-300 py-1.5 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-500/10"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          product={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}
