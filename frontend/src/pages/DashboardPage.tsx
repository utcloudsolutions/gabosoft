import { useEffect, useState } from 'react';
import {
  FileText, ClipboardList, DollarSign,
  AlertTriangle, TrendingUp, ArrowRight, RefreshCw,
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { SemaforoBadge } from '../components/ui/SemaforoBadge';
import { EstadoBadge } from '../components/ui/EstadoBadge';
import { dashboardApi, type DashboardKpis } from '../lib/api.dashboard';
import { procesosApi, type Proceso } from '../lib/api.procesos';

function fmtCOP(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000)     return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${val.toLocaleString('es-CO')}`;
}

export function DashboardPage() {
  const [kpis,    setKpis]    = useState<DashboardKpis | null>(null);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [k, p] = await Promise.all([
        dashboardApi.kpis(),
        procesosApi.list({ limit: 5 }),
      ]);
      setKpis(k);
      setProcesos(p.items);
    } catch {
      setError('No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="glass" style={{ padding: 'var(--space-5) var(--space-7)', display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cargando dashboard...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="glass-prominent" style={{ padding: 'var(--pad-card)', textAlign: 'center' }}>
          <p style={{ color: 'var(--rojo)', fontSize: 14 }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: 'var(--gap-lg)' }} onClick={load}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { porEstado, proximos30dias } = kpis!.procesos;
  const { total: totalContratos, valorTotal, valorEjecutado, avanceFinanciero, semaforos } = kpis!.contratos;
  const contratosEnRiesgo = semaforos.ROJO + semaforos.AMARILLO;

  const KPIS = [
    { label: 'Procesos activos',       value: kpis!.procesos.total, sub: 'En estructuración o presentación',       icon: FileText,      trend: 'up'      as const, trendLabel: `${porEstado.PRESENTACION} en presentación`, accentColor: 'var(--primary)',               accentGlow: 'var(--primary-glow)' },
    { label: 'Contratos en ejecución', value: totalContratos,        sub: `Valor total: ${fmtCOP(valorTotal)} COP`, icon: ClipboardList, trend: 'neutral' as const, trendLabel: `${avanceFinanciero.toFixed(0)}% ejecutado`,   accentColor: 'var(--estado-estructuracion)', accentGlow: 'rgba(129,140,248,0.25)' },
    { label: 'Contratos en riesgo',    value: contratosEnRiesgo,     sub: 'Semáforo rojo o amarillo',               icon: AlertTriangle, trend: contratosEnRiesgo > 0 ? 'down' as const : 'neutral' as const, trendLabel: `${semaforos.ROJO} rojos, ${semaforos.AMARILLO} amarillos`, accentColor: 'var(--amarillo)', accentGlow: 'var(--amarillo-glass)' },
    { label: 'Procesos ganados',        value: porEstado.GANADO,      sub: 'Estado GANADO',                          icon: TrendingUp,    trend: 'up'      as const, trendLabel: `${proximos30dias} vencen en 30 días`,      accentColor: 'var(--verde)',                 accentGlow: 'var(--verde-glass)' },
  ];

  const ESTADOS_DIST = [
    { estado: 'ESTRUCTURACION' as const, count: porEstado.ESTRUCTURACION, color: 'var(--estado-estructuracion)' },
    { estado: 'PRESENTACION'   as const, count: porEstado.PRESENTACION,   color: 'var(--estado-presentacion)' },
    { estado: 'GANADO'         as const, count: porEstado.GANADO,         color: 'var(--estado-ganado)' },
    { estado: 'NO_ADJUDICADO'  as const, count: porEstado.NO_ADJUDICADO,  color: 'var(--estado-no-adjudicado)' },
    { estado: 'DESIERTO'       as const, count: porEstado.DESIERTO,       color: 'var(--estado-desierto)' },
  ];

  const pctEjecutado = avanceFinanciero;
  const pctPendiente = 100 - pctEjecutado;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2xl)', paddingBottom: 'var(--gap-2xl)', maxWidth: 1200 }}>

      {/* KPIs */}
      <section>
        <SectionHeader title="Resumen ejecutivo" sub="Datos en tiempo real" />
        <div style={{ display: 'grid', gap: 'var(--gap-lg)', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {KPIS.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      </section>

      {/* Procesos recientes + Semáforo */}
      <div style={{ display: 'grid', gap: 'var(--gap-lg)', gridTemplateColumns: '1fr 380px' }}>

        <section>
          <SectionHeader title="Procesos recientes" action="Ver todos" actionTo="/precontractual" />
          <div className="list-glass">
            {procesos.length === 0 && (
              <div className="list-row" style={{ justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay procesos aún</span>
              </div>
            )}
            {procesos.map((p) => (
              <div key={p.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.entidad.nombre}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)', flexShrink: 0 }}>
                  {p.valorEstimado && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                      {fmtCOP(p.valorEstimado)}
                    </span>
                  )}
                  <EstadoBadge value={p.estado} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Semáforo contratos" action="Ver todos" actionTo="/contratos" />
          <div className="list-glass">
            <div className="list-row" style={{ justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Estado general</span>
              <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
                <span style={{ color: 'var(--verde)',    fontSize: 12, fontWeight: 700 }}>{semaforos.VERDE} verde</span>
                <span style={{ color: 'var(--amarillo)', fontSize: 12, fontWeight: 700 }}>{semaforos.AMARILLO} amarillo</span>
                <span style={{ color: 'var(--rojo)',     fontSize: 12, fontWeight: 700 }}>{semaforos.ROJO} rojo</span>
              </div>
            </div>
            <div className="list-row" style={{ gap: 'var(--gap-md)' }}>
              <SemaforoBadge value="VERDE" />
              <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: totalContratos > 0 ? `${(semaforos.VERDE / totalContratos) * 100}%` : '0%', height: 6, borderRadius: 'var(--radius-full)', background: 'var(--verde)' }} />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 16, textAlign: 'right' }}>{semaforos.VERDE}</span>
            </div>
            <div className="list-row" style={{ gap: 'var(--gap-md)' }}>
              <SemaforoBadge value="AMARILLO" />
              <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: totalContratos > 0 ? `${(semaforos.AMARILLO / totalContratos) * 100}%` : '0%', height: 6, borderRadius: 'var(--radius-full)', background: 'var(--amarillo)' }} />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 16, textAlign: 'right' }}>{semaforos.AMARILLO}</span>
            </div>
            <div className="list-row" style={{ gap: 'var(--gap-md)' }}>
              <SemaforoBadge value="ROJO" />
              <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: totalContratos > 0 ? `${(semaforos.ROJO / totalContratos) * 100}%` : '0%', height: 6, borderRadius: 'var(--radius-full)', background: 'var(--rojo)' }} />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 16, textAlign: 'right' }}>{semaforos.ROJO}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Distribución precontractual */}
      <section>
        <SectionHeader title="Distribución precontractual" sub="Procesos por estado" />
        <div style={{ display: 'grid', gap: 'var(--gap-md)', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {ESTADOS_DIST.map(({ estado, count, color }) => (
            <div
              key={estado}
              className="glass"
              style={{
                padding: 'var(--space-6) var(--space-4)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 'var(--gap-md)',
                transition: 'transform 200ms ease, border-color 200ms ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{count}</span>
              <EstadoBadge value={estado} />
            </div>
          ))}
        </div>
      </section>

      {/* Valor financiero */}
      <section>
        <SectionHeader title="Valor financiero en gestión" />
        <div className="glass" style={{ padding: 'var(--pad-card)', display: 'flex', alignItems: 'center', gap: 'var(--gap-xl)' }}>
          <div style={{ width: 56, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--verde-glass)', border: '1px solid rgba(34,197,94,0.28)', boxShadow: '0 0 16px rgba(34,197,94,0.18)' }}>
            <DollarSign size={24} style={{ color: 'var(--verde)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total contratos activos</p>
            <p style={{ color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', margin: 'var(--gap-xs) 0' }}>
              {fmtCOP(valorTotal)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>COP · {new Date().getFullYear()}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)', flexShrink: 0 }}>
            <FinancialRow label="Ejecutado" value={fmtCOP(valorEjecutado)} pct={pctEjecutado} color="var(--verde)" />
            <FinancialRow label="Pendiente" value={fmtCOP(valorTotal - valorEjecutado)} pct={pctPendiente} color="var(--amarillo)" />
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, action, actionTo }: {
  title: string; sub?: string; action?: string; actionTo?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--gap-md)' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>{title}</h2>
        {sub && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)' }}>{sub}</p>}
      </div>
      {action && actionTo && (
        <a href={actionTo} style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)', color: 'var(--primary-light)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
          {action} <ArrowRight size={12} />
        </a>
      )}
    </div>
  );
}

function FinancialRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 72 }}>{label}</span>
      <div style={{ width: 96, height: 6, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.10)' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: 6, borderRadius: 'var(--radius-full)', background: color }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
