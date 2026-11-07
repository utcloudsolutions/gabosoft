import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './router/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrecontractualPage } from './pages/PrecontractualPage';
import { ContratosPage } from './pages/ContratosPage';
import { CatalogosPage } from './pages/CatalogosPage';
import { NotificacionesPage } from './pages/NotificacionesPage';
import './styles/globals.css';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/precontractual" element={<PrecontractualPage />} />
            <Route path="/contratos" element={<ContratosPage />} />
            <Route path="/catalogos" element={<CatalogosPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
