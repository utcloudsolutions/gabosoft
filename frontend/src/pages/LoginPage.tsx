import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const navigate   = useNavigate();
  const login      = useAuthStore((s) => s.login);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', width: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(59,130,246,0.50) 0%, rgba(59,130,246,0.18) 40%, transparent 70%)', borderRadius: '50%', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(129,140,248,0.42) 0%, rgba(99,102,241,0.14) 40%, transparent 70%)', borderRadius: '50%', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', top: '45%', left: '35%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, margin: '0 var(--space-4)', animation: 'fadeUp 0.45s ease both' }}>
        <div className="glass-prominent" style={{ padding: 'var(--space-8) var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)' }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--gap-md)' }}>
            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--primary-glass)', border: '1px solid var(--primary-glow)', boxShadow: '0 0 20px var(--primary-glow)' }}>
              <span style={{ fontSize: 24 }}>🏛</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>TechTransit</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 'var(--gap-xs)' }}>Gestión de Contratación Pública</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
              <label className="section-label" style={{ textTransform: 'none', fontSize: 12, letterSpacing: 'normal', color: 'var(--text-secondary)' }}>
                Correo electrónico
              </label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@entidad.gov.co"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
              <label className="section-label" style={{ textTransform: 'none', fontSize: 12, letterSpacing: 'normal', color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)' }}>
                <AlertCircle size={14} style={{ color: 'var(--rojo)', flexShrink: 0 }} />
                <span style={{ color: 'var(--rojo)', fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: 'var(--gap-xs)' }}
            >
              {loading
                ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                : <LogIn size={15} />
              }
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--gap-lg)', color: 'var(--text-muted)', fontSize: 12 }}>
          v1.0 · TechTransit
        </p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
