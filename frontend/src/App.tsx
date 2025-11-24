import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProductsPage from './pages/Products';
import ClientsPage from './pages/Clients';
import CouponsPage from './pages/Coupons';
import SalesPage from './pages/Sales';
import PixPage from './pages/Pix';
import AnalyticsPage from './pages/Analytics';
import EmployeesPage from './pages/Employees';
import LandingPage from './pages/Landing';
import ClientRegisterPage from './pages/ClientRegister';
import { AppLayout } from './components/Layout';
import { SalesLayout } from './components/SalesLayout';

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6 text-center text-slate-600">Carregando...</div>;
  const nextPath = `${location.pathname}${location.search || ''}`;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="cupons" element={<CouponsPage />} />
          <Route path="pix" element={<PixPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="funcionarios" element={<EmployeesPage />} />
        </Route>
        <Route
          path="/vendas"
          element={
            <Protected>
              <SalesLayout>
                <SalesPage />
              </SalesLayout>
            </Protected>
          }
        />
        <Route
          path="/cliente"
          element={
            <Protected>
              <ClientRegisterPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
