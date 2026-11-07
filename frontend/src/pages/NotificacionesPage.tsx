import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, RefreshCw, Bell, ChevronRight } from 'lucide-react';
import { notificacionesApi, type Notificacion, type Severidad } from '../lib/api.notificaciones';
import { fmtFecha } from '../lib/fechas';

// ── Config visual por severidad ───────────────────────────────────────────────
const SEV_CFG: Record<
  Severidad,
  {
    color: string;
    bg: string;
    border: string;
    Icon: typeof AlertCircle;
  }
> = {
  danger: {
    color: 'var(--rojo)',
    bg: 'var(--rojo-glass)',
    border: 'rgba(239,68,68,0.28)',
    Icon: AlertCircle,
  },
  warning: {
    color: 'var(--amarillo)',
    bg: 'var(--amarillo-glass)',
    border: 'rgba(245,158,11,0.28)',
    Icon: AlertTriangle,
  },
  info: {
    color: 'var(--primary-light)',
    bg: 'var(--primary-glass)',
    border: 'rgba(59,130,246,0.28)',
    Icon: Info,
  },
};

const TIPO_ORDER = [
  'Contrato en riesgo',
  'Hito vencido',
  'Contrato por vencer',
  'Proceso por cerrar',
];

// ═══════════════════════════════════════════════════════════════════════════════
export function NotificacionesPage() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await notificacionesApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const marcarLeida = (id: string) => setLeidas((prev) => new Set([...prev, id]));
  const marcarTodas = () => setLeidas(new Set(items.map((n) => n.id)));
  const sinLeer = items.filter((n) => !leidas.has(n.id));
  const danger = items.filter((n) => n.severidad === 'danger').length;
  const warning = items.filter((n) => n.severidad === 'warning').length;

  // Agrupar por tipo en el orden definido
  const grupos = TIPO_ORDER.map((tipo) => ({
    tipo,
    items: items.filter((n) => n.tipo === tipo),
  })).filter((g) => g.items.length > 0);

  // Tipos extra no contemplados en el orden
  const tiposExtra = [...new Set(items.map((n) => n.tipo))].filter((t) => !TIPO_ORDER.includes(t));
  for (const tipo of tiposExtra) {
    grupos.push({ tipo, items: items.filter((n) => n.tipo === tipo) });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-xl)',
        maxWidth: 780,
        paddingBottom: 'var(--gap-2xl)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {sinLeer.length > 0
              ? `${sinLeer.length} sin leer · ${danger} críticas · ${warning} advertencias`
              : items.length > 0
                ? 'Todo al día'
                : 'Sin alertas activas'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
          {sinLeer.length > 0 && (
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={marcarTodas}>
              Marcar todas como leídas
            </button>
          )}
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Resumen KPI strip */}
      {items.length > 0 && (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap-md)' }}
        >
          <KpiStrip label="Críticas" value={danger} color="var(--rojo)" glow="var(--rojo-glass)" />
          <KpiStrip
            label="Advertencias"
            value={warning}
            color="var(--amarillo)"
            glow="var(--amarillo-glass)"
          />
          <KpiStrip
            label="Total alertas"
            value={items.length}
            color="var(--primary-light)"
            glow="var(--primary-glass)"
          />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && items.length === 0 && (
        <div
          className="glass"
          style={{
            padding: 'var(--space-8) var(--space-7)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--gap-lg)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--verde-glass)',
              border: '1px solid rgba(34,197,94,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={24} style={{ color: 'var(--verde)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              Todo en orden
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 'var(--gap-xs)' }}>
              No hay alertas activas en este momento
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-7)' }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Grupos */}
      {!loading &&
        grupos.map(({ tipo, items: gItems }) => (
          <section key={tipo}>
            {/* Group header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--gap-sm)',
                marginBottom: 'var(--gap-md)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--gap-xs)',
                  padding: 'var(--pad-badge)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 11,
                  fontWeight: 600,
                  background: SEV_CFG[gItems[0].severidad].bg,
                  color: SEV_CFG[gItems[0].severidad].color,
                  border: `1px solid ${SEV_CFG[gItems[0].severidad].border}`,
                }}
              >
                {tipo}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {gItems.length} alerta{gItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
              {gItems.map((n) => {
                const cfg = SEV_CFG[n.severidad];
                const Icon = cfg.Icon;
                const leida = leidas.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      marcarLeida(n.id);
                      navigate(n.enlace);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--gap-lg)',
                      padding: 'var(--space-4) var(--space-5)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${leida ? 'var(--glass-border)' : cfg.border}`,
                      background: leida ? 'var(--glass-xs)' : cfg.bg,
                      cursor: 'pointer',
                      opacity: leida ? 0.55 : 1,
                      transition: 'opacity 200ms, background 200ms',
                    }}
                  >
                    {/* Ícono */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: leida ? 'rgba(255,255,255,0.06)' : `${cfg.bg}`,
                        border: `1px solid ${leida ? 'var(--glass-border)' : cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} style={{ color: leida ? 'var(--text-muted)' : cfg.color }} />
                    </div>

                    {/* Texto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 'var(--gap-md)',
                        }}
                      >
                        <p
                          style={{
                            color: leida ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: 13.5,
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          {n.titulo}
                        </p>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                          {fmtFecha(n.fecha)}
                        </span>
                      </div>
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 12.5,
                          marginTop: 'var(--gap-xs)',
                          lineHeight: 1.5,
                        }}
                      >
                        {n.descripcion}
                      </p>
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          marginTop: 'var(--gap-xs)',
                        }}
                      >
                        {n.entidad}
                      </p>
                    </div>

                    <ChevronRight
                      size={14}
                      style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}

function KpiStrip({
  label,
  value,
  color,
  glow,
}: {
  label: string;
  value: number;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-md)',
      }}
    >
      <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
      <div
        style={{
          marginLeft: 'auto',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${glow}`,
        }}
      />
    </div>
  );
}
