import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, BookOpen, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/precontractual', icon: FileText,         label: 'Precontractual' },
  { to: '/contratos',      icon: ClipboardList,    label: 'Contratos' },
  { to: '/catalogos',      icon: BookOpen,         label: 'Catálogos' },
  { to: '/notificaciones', icon: Bell,             label: 'Notificaciones' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside style={{
      position: 'relative', zIndex: 10,
      width: 'var(--sidebar-w)', flexShrink: 0,
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'var(--pad-sidebar)',
      gap: 'var(--gap-xs)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: '1px solid var(--glass-border)',
      boxShadow: '1px 0 0 0 rgba(255,255,255,0.04) inset',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)', padding: 'var(--space-1) var(--space-2) var(--space-5)', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 'var(--gap-xs)' }}>
        <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--primary-glass)', border: '1px solid var(--primary-glow)', boxShadow: '0 0 16px var(--primary-glow)' }}>
          <span style={{ fontSize: 16 }}>🏛</span>
        </div>
        <div>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>TechTransit</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Contratación Pública</p>
        </div>
      </div>

      {/* Label */}
      <p className="section-label" style={{ padding: 'var(--gap-xs) var(--space-2)', margin: 'var(--gap-xs) 0 var(--gap-sm)' }}>Módulos</p>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xs)', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 'var(--gap-md)',
              padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-3)',
              paddingTop: 10, paddingBottom: 10,
              borderRadius: 'var(--radius-md)',
              fontSize: 13.5, fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 180ms ease',
              color:      isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.22)' : 'transparent',
              border:     isActive ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
              boxShadow:  isActive ? '0 2px 12px rgba(59,130,246,0.20)' : 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} style={{ flexShrink: 0, color: isActive ? 'var(--primary-light)' : 'rgba(255,255,255,0.40)' }} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={13} style={{ color: 'var(--primary-light)', opacity: 0.8 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer usuario */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--glass-xs)', border: '1px solid var(--glass-border)' }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--primary-glass)', color: 'var(--primary-light)', border: '1px solid var(--primary-glow)', fontSize: 12, fontWeight: 700 }}>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{user?.rol ?? ''}</p>
          </div>
        </div>

        <button
          onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
