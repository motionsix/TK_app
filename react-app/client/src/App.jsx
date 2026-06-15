import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

import PublicLayout from './components/PublicLayout';

import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Thankyou from './pages/Thankyou';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin area is only for staff — split it into its own chunk so the public
// storefront bundle stays small and loads faster for shoppers.
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminOrderView = lazy(() => import('./pages/admin/OrderView'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminDividend = lazy(() => import('./pages/admin/Dividend'));
const AdminLoyverse = lazy(() => import('./pages/admin/Loyverse'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-muted">
      กำลังโหลด...
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        <Route
          path="/thankyou/:orderId"
          element={
            <RequireAuth>
              <Thankyou />
            </RequireAuth>
          }
        />
        <Route
          path="/my-orders"
          element={
            <RequireAuth>
              <MyOrders />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        element={
          <RequireAdmin>
            <Suspense fallback={<Loading />}>
              <AdminLayout />
            </Suspense>
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/orders/:id" element={<AdminOrderView />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/dividend" element={<AdminDividend />} />
        <Route path="/admin/loyverse" element={<AdminLoyverse />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
