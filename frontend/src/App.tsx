import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProductsPage from './pages/Products';
import ClientsPage from './pages/Clients';
import CouponsPage from './pages/Coupons';
import SalesPage from './pages/Sales';
import PixPage from './pages/Pix';
import AnalyticsPage from './pages/Analytics';
import { AppLayout } from './components/Layout';

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-center text-slate-600">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="admin" element={<DashboardPage />} />
          <Route path="admin/produtos" element={<ProductsPage />} />
          <Route path="admin/clientes" element={<ClientsPage />} />
          <Route path="admin/cupons" element={<CouponsPage />} />
          <Route path="admin/vendas" element={<SalesPage />} />
          <Route path="admin/pix" element={<PixPage />} />
          <Route path="admin/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
