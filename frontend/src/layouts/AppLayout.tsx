import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/precontractual': 'Gestión Precontractual',
  '/contratos':      'Gestión de Contratos',
  '/catalogos':      'Catálogos',
  '/notificaciones': 'Notificaciones',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const user  = useAuthStore((s) => s.user);
  const title = PAGE_TITLES[pathname] ?? 'TechTransit';

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
            <button style={{
              position: 'relative',
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-xs)',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <Bell size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }} />
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
