import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100svh',
          background: 'var(--bg-base)',
        }}
      >
        <div
          className="glass"
          style={{
            padding: 'var(--space-5) var(--space-7)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gap-md)',
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cargando...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
