import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './router/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrecontractualPage } from './pages/PrecontractualPage';
import './styles/globals.css';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/precontractual" element={<PrecontractualPage />} />
            <Route path="/contratos"      element={<PlaceholderPage title="Gestión de Contratos" />} />
            <Route path="/catalogos"      element={<PlaceholderPage title="Catálogos" />} />
            <Route path="/notificaciones" element={<PlaceholderPage title="Notificaciones" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="glass-prominent" style={{ padding: 'var(--space-8) var(--space-7)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Próximamente</p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 600, marginTop: 'var(--gap-xs)' }}>{title}</h2>
      </div>
    </div>
  );
}
