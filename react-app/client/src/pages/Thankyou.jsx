import { useParams, Link } from 'react-router-dom';

export default function Thankyou() {
  const { orderId } = useParams();

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg animate-fadeInUp p-10 text-center shadow-card sm:p-12">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-5xl text-brand-green dark:bg-emerald-500/15">
          <i className="bi bi-check-lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-ink">สั่งซื้อสำเร็จแล้ว!</h2>
        <p className="mt-2 text-muted">
          ขอบคุณที่อุดหนุนสหกรณ์โรงเรียน เจ้าหน้าที่จะเตรียมสินค้าไว้รอตามเวลาที่คุณแจ้ง
        </p>
        <div className="my-6 inline-block rounded-2xl border border-line bg-surface-2 px-6 py-3">
          <span className="text-sm text-muted">เลขที่คำสั่งซื้อ</span>
          <div className="text-2xl font-extrabold text-brand-blue dark:text-accent">
            #{String(orderId).padStart(5, '0')}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/my-orders" className="btn-primary">
            <i className="bi bi-receipt" /> ดูประวัติการสั่งซื้อ
          </Link>
          <Link to="/" className="btn-secondary">
            <i className="bi bi-bag" /> กลับไปช้อปต่อ
          </Link>
        </div>
      </div>
    </div>
  );
}
