import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { notificacionesApi } from '../lib/api.notificaciones';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/precontractual': 'Gestión Precontractual',
  '/contratos':      'Gestión de Contratos',
  '/catalogos':      'Catálogos',
  '/notificaciones': 'Notificaciones',
};

export function AppLayout() {
  const { pathname }    = useLocation();
  const navigate        = useNavigate();
  const user            = useAuthStore((s) => s.user);
  const title           = PAGE_TITLES[pathname] ?? 'TechTransit';
  const [count, setCount] = useState(0);

  useEffect(() => {
    notificacionesApi.conteo().then(setCount).catch(() => {});
    // Refresca el conteo cada 2 minutos
    const id = setInterval(() => notificacionesApi.conteo().then(setCount).catch(() => {}), 120_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100svh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div className="bg-ambient" />
      <div className="bg-ambient-extra" />

      <Sidebar />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--pad-topbar)',
          height: 'var(--topbar-h)',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: '0 1px 0 0 rgba(255,255,255,0.05) inset',
        }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>{title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
            {/* Notificaciones */}
            <button
              onClick={() => navigate('/notificaciones')}
              style={{
                position: 'relative',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${count > 0 ? 'rgba(239,68,68,0.35)' : 'var(--glass-border)'}`,
                background: count > 0 ? 'rgba(239,68,68,0.10)' : 'var(--glass-xs)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border-color 200ms, background 200ms',
              }}
            >
              <Bell size={15} style={{ color: count > 0 ? 'var(--rojo)' : 'var(--text-secondary)' }} />
              {count > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: 'var(--rojo)',
                  color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--primary-glass)',
              color: 'var(--primary-light)',
              border: '1px solid var(--primary-glow)',
              boxShadow: '0 0 12px var(--primary-glow)',
              fontSize: 12, fontWeight: 700,
              flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'var(--pad-section)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
