import { useEffect, useState, useRef } from 'react';
import {
  Plus, RefreshCw, X, CheckCircle2, Circle, Clock, AlertCircle,
  Building2, User, Calendar, DollarSign, ChevronRight, Pencil, Trash2,
} from 'lucide-react';
import { contratosApi, type Contrato, type SemaforoContrato, type HitoContrato, type EstadoHito, type CreateContratoPayload, type UpdateContratoPayload, type CreateHitoPayload, type UpdateHitoPayload } from '../lib/api.contratos';
import { api } from '../lib/api';
import { SemaforoBadge } from '../components/ui/SemaforoBadge';
import { Select, type SelectOption } from '../components/ui/Select';
import { useAuthStore } from '../store/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCOP(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000)     return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${val.toLocaleString('es-CO')}`;
}
function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function diasRestantes(fechaFin: string) {
  return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const SEMAFORO_OPTIONS: SelectOption[] = [
  { value: 'VERDE',    label: 'Verde'    },
  { value: 'AMARILLO', label: 'Amarillo' },
  { value: 'ROJO',     label: 'Rojo'     },
];

const HITO_ESTADO_CFG: Record<EstadoHito, { label: string; color: string; Icon: typeof Circle }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'var(--text-muted)',    Icon: Circle        },
  EN_PROGRESO: { label: 'En progreso', color: 'var(--primary-light)', Icon: Clock         },
  COMPLETADO:  { label: 'Completado',  color: 'var(--verde)',         Icon: CheckCircle2  },
  VENCIDO:     { label: 'Vencido',     color: 'var(--rojo)',          Icon: AlertCircle   },
};

// ── Hook selects ──────────────────────────────────────────────────────────────
function useSelects() {
  const [entidades, setEntidades] = useState<SelectOption[]>([]);
  const [usuarios,  setUsuarios]  = useState<SelectOption[]>([]);
  useEffect(() => {
    Promise.all([
      api.get<{ id: string; nombre: string }[]>('/entidades').then((r) => r.data),
      api.get<{ id: string; nombre: string }[]>('/usuarios').then((r) => r.data),
    ]).then(([e, u]) => {
      setEntidades(e.map((x) => ({ value: x.id, label: x.nombre })));
      setUsuarios(u.map((x) => ({ value: x.id, label: x.nombre })));
    }).catch(() => {});
  }, []);
  return { entidades, usuarios };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export function ContratosPage() {
  const [contratos,     setContratos]     = useState<Contrato[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [editContrato,  setEditContrato]  = useState<Contrato | null>(null);
  const [detalle,       setDetalle]       = useState<Contrato | null>(null);
  const [filterSemaforo, setFilterSemaforo] = useState('');
  const user     = useAuthStore((s) => s.user);
  const canWrite = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await contratosApi.list({
        limit: 100,
        ...(filterSemaforo ? { semaforo: filterSemaforo } : {}),
      });
      setContratos(res.items);
      setTotal(res.total);
    } catch { setError('No se pudo cargar los contratos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterSemaforo]);

  const handleSaved = (c: Contrato) => {
    setContratos((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = c; return n; }
      return [c, ...prev];
    });
    if (detalle?.id === c.id) setDetalle(c);
    setShowModal(false); setEditContrato(null);
  };

  const handleSemaforoChange = async (id: string, sem: SemaforoContrato) => {
    const updated = await contratosApi.updateSemaforo(id, sem);
    setContratos((prev) => prev.map((c) => (c.id === id ? updated : c)));
    if (detalle?.id === id) setDetalle(updated);
  };

  const handleHitoUpdate = (contratoId: string, hito: HitoContrato) => {
    setContratos((prev) => prev.map((c) => {
      if (c.id !== contratoId) return c;
      const hitos = c.hitos.some((h) => h.id === hito.id)
        ? c.hitos.map((h) => (h.id === hito.id ? hito : h))
        : [...c.hitos, hito];
      return { ...c, hitos };
    }));
    if (detalle?.id === contratoId) {
      setDetalle((prev) => {
        if (!prev) return prev;
        const hitos = prev.hitos.some((h) => h.id === hito.id)
          ? prev.hitos.map((h) => (h.id === hito.id ? hito : h))
          : [...prev.hitos, hito];
        return { ...prev, hitos };
      });
    }
  };

  const handleHitoDeleted = (contratoId: string, hitoId: string) => {
    const removeHito = (c: Contrato) =>
      c.id === contratoId ? { ...c, hitos: c.hitos.filter((h) => h.id !== hitoId) } : c;
    setContratos((prev) => prev.map(removeHito));
    if (detalle?.id === contratoId) setDetalle((prev) => prev ? removeHito(prev) : prev);
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 'var(--gap-lg)', minHeight: 0 }}>

      {/* ── Lista ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)', minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{total} contrato{total !== 1 ? 's' : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
            <Select
              value={filterSemaforo}
              onChange={setFilterSemaforo}
              options={SEMAFORO_OPTIONS}
              placeholder="Todos los semáforos"
              style={{ minWidth: 180 }}
            />
            <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
              <RefreshCw size={13} />
            </button>
            {canWrite && (
              <button className="btn-primary" onClick={() => { setEditContrato(null); setShowModal(true); }}>
                <Plus size={14} /> Nuevo contrato
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--rojo)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <div className="list-glass" style={{ flex: 1, overflowY: 'auto' }}>
            {contratos.length === 0 && (
              <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No hay contratos registrados
              </div>
            )}
            {contratos.map((c) => (
              <ContratoRow
                key={c.id}
                contrato={c}
                isActive={detalle?.id === c.id}
                canWrite={canWrite}
                onClick={() => setDetalle(c)}
                onEdit={() => { setEditContrato(c); setShowModal(true); }}
                onSemaforoChange={handleSemaforoChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Panel detalle ─────────────────────────────────────────────────── */}
      {detalle && (
        <DetallePanel
          contrato={detalle}
          canWrite={canWrite}
          onClose={() => setDetalle(null)}
          onHitoUpdate={handleHitoUpdate}
          onHitoDeleted={handleHitoDeleted}
        />
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <ContratoModal
          contrato={editContrato}
          onClose={() => { setShowModal(false); setEditContrato(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Fila de contrato ──────────────────────────────────────────────────────────
function ContratoRow({ contrato: c, isActive, canWrite, onClick, onEdit, onSemaforoChange }: {
  contrato: Contrato;
  isActive: boolean;
  canWrite: boolean;
  onClick: () => void;
  onEdit: () => void;
  onSemaforoChange: (id: string, s: SemaforoContrato) => void;
}) {
  const dias     = diasRestantes(c.fechaFin);
  const pctFin   = Math.min(Number(c.avanceFisico), 100);
  const barColor = c.semaforo === 'VERDE' ? 'var(--verde)' : c.semaforo === 'AMARILLO' ? 'var(--amarillo)' : 'var(--rojo)';

  return (
    <div
      className="list-row"
      onClick={onClick}
      style={{
        flexDirection: 'column', alignItems: 'stretch', gap: 'var(--gap-md)', cursor: 'pointer',
        background: isActive ? 'rgba(59,130,246,0.07)' : undefined,
        borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
      }}
    >
      {/* Línea 1: número + semáforo + botones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
        <SemaforoBadge value={c.semaforo} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.objeto}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
            {c.numeroContrato} · {c.entidad.nombre}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', flexShrink: 0 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
            {fmtCOP(Number(c.valorTotal))}
          </span>
          {canWrite && (
            <button
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil size={11} />
            </button>
          )}
          <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Línea 2: avance + fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-lg)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Avance físico</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>{pctFin}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ width: `${pctFin}%`, height: 5, borderRadius: 'var(--radius-full)', background: barColor, transition: 'width 500ms ease' }} />
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <p style={{ color: dias < 0 ? 'var(--rojo)' : dias <= 15 ? 'var(--amarillo)' : 'var(--text-muted)', fontSize: 11 }}>
            {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : `${dias} días restantes`}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>
            {fmtFecha(c.fechaFin)}
          </p>
        </div>
      </div>

      {/* Semáforo manual (solo canWrite) */}
      {canWrite && (
        <div style={{ display: 'flex', gap: 'var(--gap-sm)', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Semáforo manual:</span>
          {(['VERDE', 'AMARILLO', 'ROJO'] as SemaforoContrato[]).map((s) => (
            <button
              key={s}
              onClick={() => onSemaforoChange(c.id, s)}
              style={{
                width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: s === 'VERDE' ? 'var(--verde)' : s === 'AMARILLO' ? 'var(--amarillo)' : 'var(--rojo)',
                opacity: c.semaforo === s ? 1 : 0.3,
                transition: 'opacity 200ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel de detalle con hitos ────────────────────────────────────────────────
function DetallePanel({ contrato, canWrite, onClose, onHitoUpdate, onHitoDeleted }: {
  contrato: Contrato;
  canWrite: boolean;
  onClose: () => void;
  onHitoUpdate: (contratoId: string, h: HitoContrato) => void;
  onHitoDeleted: (contratoId: string, hitoId: string) => void;
}) {
  const [showHitoForm, setShowHitoForm] = useState(false);
  const [editHito,     setEditHito]     = useState<HitoContrato | null>(null);
  const pctFin = Math.min(Number(contrato.avanceFisico), 100);
  const pctEjec = contrato.valorTotal > 0
    ? Math.min((Number(contrato.valorEjecutado) / Number(contrato.valorTotal)) * 100, 100)
    : 0;

  return (
    <div style={{
      width: 340, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--glass-sm)',
      backdropFilter: 'var(--blur-md)',
      WebkitBackdropFilter: 'var(--blur-md)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--gap-md)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-xs)' }}>
            <SemaforoBadge value={contrato.semaforo} />
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{contrato.numeroContrato}</span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{contrato.objeto}</p>
        </div>
        <button className="btn-ghost" style={{ padding: 6, flexShrink: 0 }} onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)' }}>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
          <MetaRow icon={<Building2 size={12} />} label="Entidad"      value={contrato.entidad.nombre} />
          <MetaRow icon={<User       size={12} />} label="Responsable"  value={contrato.responsable.nombre} />
          <MetaRow icon={<Calendar   size={12} />} label="Inicio"       value={fmtFecha(contrato.fechaInicio)} />
          <MetaRow icon={<Calendar   size={12} />} label="Fin"          value={fmtFecha(contrato.fechaFin)} />
          <MetaRow icon={<DollarSign size={12} />} label="Valor total"  value={fmtCOP(Number(contrato.valorTotal))} />
          {contrato.proceso && (
            <MetaRow icon={<ChevronRight size={12} />} label="Proceso" value={contrato.proceso.nombre} />
          )}
        </div>

        {/* Avances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <p className="section-label">Avance</p>
          <ProgressRow label="Físico" pct={pctFin} color={contrato.semaforo === 'VERDE' ? 'var(--verde)' : contrato.semaforo === 'AMARILLO' ? 'var(--amarillo)' : 'var(--rojo)'} />
          <ProgressRow label="Financiero" pct={pctEjec} color="var(--primary-light)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--gap-xs)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Ejecutado</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>{fmtCOP(Number(contrato.valorEjecutado))} / {fmtCOP(Number(contrato.valorTotal))}</span>
          </div>
        </div>

        {/* Hitos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="section-label">Hitos ({contrato.hitos.length})</p>
            {canWrite && (
              <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => { setEditHito(null); setShowHitoForm(true); }}>
                <Plus size={11} /> Agregar
              </button>
            )}
          </div>

          {contrato.hitos.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Sin hitos registrados
            </p>
          )}

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {contrato.hitos.map((h, i) => (
              <HitoItem
                key={h.id}
                hito={h}
                isLast={i === contrato.hitos.length - 1}
                canWrite={canWrite}
                onEdit={() => { setEditHito(h); setShowHitoForm(true); }}
                onDelete={async () => {
                  await contratosApi.deleteHito(contrato.id, h.id);
                  onHitoDeleted(contrato.id, h.id);
                }}
                onEstadoChange={async (estado) => {
                  const updated = await contratosApi.updateHito(contrato.id, h.id, { estado });
                  onHitoUpdate(contrato.id, updated);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hito form inline */}
      {showHitoForm && (
        <HitoModal
          hito={editHito}
          onClose={() => { setShowHitoForm(false); setEditHito(null); }}
          onSaved={async (payload) => {
            let result: HitoContrato;
            if (editHito) {
              result = await contratosApi.updateHito(contrato.id, editHito.id, payload as UpdateHitoPayload);
            } else {
              result = await contratosApi.createHito(contrato.id, payload as CreateHitoPayload);
            }
            onHitoUpdate(contrato.id, result);
            setShowHitoForm(false);
            setEditHito(null);
          }}
        />
      )}
    </div>
  );
}

// ── Hito timeline item ────────────────────────────────────────────────────────
function HitoItem({ hito, isLast, canWrite, onEdit, onDelete, onEstadoChange }: {
  hito: HitoContrato;
  isLast: boolean;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEstadoChange: (e: EstadoHito) => void;
}) {
  const cfg  = HITO_ESTADO_CFG[hito.estado];
  const Icon = cfg.Icon;
  const vencido = hito.estado !== 'COMPLETADO' && new Date(hito.fechaLimite) < new Date();

  const ESTADOS_NEXT: Record<EstadoHito, EstadoHito | null> = {
    PENDIENTE:   'EN_PROGRESO',
    EN_PROGRESO: 'COMPLETADO',
    COMPLETADO:  null,
    VENCIDO:     'COMPLETADO',
  };
  const next = ESTADOS_NEXT[hito.estado];

  return (
    <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
      {/* Línea de tiempo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
        <Icon size={16} style={{ color: vencido ? 'var(--rojo)' : cfg.color, flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--glass-border)', marginTop: 4, minHeight: 16 }} />}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 'var(--gap-lg)', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--gap-sm)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{hito.nombre}</p>
            <p style={{ color: vencido ? 'var(--rojo)' : 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
              {fmtFecha(hito.fechaLimite)}
              {hito.valorAsociado ? ` · ${fmtCOP(hito.valorAsociado)}` : ''}
            </p>
          </div>
          {canWrite && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {next && (
                <button className="btn-ghost" style={{ padding: '3px 6px', fontSize: 10 }} onClick={() => onEstadoChange(next)}>
                  <CheckCircle2 size={10} />
                </button>
              )}
              <button className="btn-ghost" style={{ padding: '3px 6px', fontSize: 10 }} onClick={onEdit}>
                <Pencil size={10} />
              </button>
              <button className="btn-ghost" style={{ padding: '3px 6px', fontSize: 10, color: 'var(--rojo)' }} onClick={onDelete}>
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function ProgressRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${pct}%`, height: 5, borderRadius: 'var(--radius-full)', background: color, transition: 'width 500ms ease' }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Modal Crear / Editar Contrato ─────────────────────────────────────────────
type ContratoForm = {
  entidadId: string; responsableId: string; numeroContrato: string;
  objeto: string; valorTotal: string; valorEjecutado: string;
  avanceFisico: string; fechaInicio: string; fechaFin: string;
  supervisorNombre: string; supervisorEmail: string; notas: string;
};

function ContratoModal({ contrato, onClose, onSaved }: {
  contrato: Contrato | null;
  onClose: () => void;
  onSaved: (c: Contrato) => void;
}) {
  const { entidades, usuarios } = useSelects();
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ContratoForm>({
    entidadId:        contrato?.entidad.id      ?? '',
    responsableId:    contrato?.responsable.id  ?? '',
    numeroContrato:   contrato?.numeroContrato  ?? '',
    objeto:           contrato?.objeto          ?? '',
    valorTotal:       contrato?.valorTotal      ? String(contrato.valorTotal) : '',
    valorEjecutado:   contrato?.valorEjecutado  ? String(contrato.valorEjecutado) : '',
    avanceFisico:     contrato?.avanceFisico    ? String(contrato.avanceFisico) : '',
    fechaInicio:      contrato?.fechaInicio     ? contrato.fechaInicio.slice(0, 10) : '',
    fechaFin:         contrato?.fechaFin        ? contrato.fechaFin.slice(0, 10) : '',
    supervisorNombre: contrato?.supervisorNombre ?? '',
    supervisorEmail:  contrato?.supervisorEmail  ?? '',
    notas:            contrato?.notas            ?? '',
  });

  const onInput = (k: keyof ContratoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entidadId || !form.responsableId || !form.numeroContrato || !form.objeto || !form.valorTotal || !form.fechaInicio || !form.fechaFin) {
      setErr('Todos los campos marcados con * son obligatorios.');
      return;
    }
    setSaving(true); setErr('');
    try {
      const base: CreateContratoPayload = {
        entidadId:        form.entidadId,
        responsableId:    form.responsableId,
        numeroContrato:   form.numeroContrato,
        objeto:           form.objeto,
        valorTotal:       Number(form.valorTotal),
        fechaInicio:      form.fechaInicio,
        fechaFin:         form.fechaFin,
        supervisorNombre: form.supervisorNombre || undefined,
        supervisorEmail:  form.supervisorEmail  || undefined,
        notas:            form.notas            || undefined,
      };
      let saved: Contrato;
      if (contrato) {
        const upd: UpdateContratoPayload = {
          ...base,
          valorEjecutado: form.valorEjecutado ? Number(form.valorEjecutado) : undefined,
          avanceFisico:   form.avanceFisico   ? Number(form.avanceFisico)   : undefined,
        };
        saved = await contratosApi.update(contrato.id, upd);
      } else {
        saved = await contratosApi.create(base);
      }
      onSaved(saved);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al guardar';
      setErr(msg);
    } finally { setSaving(false); }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(7,7,26,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}
    >
      <div className="glass-prominent" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-6) var(--space-7)', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              {contrato ? 'Editar contrato' : 'Nuevo contrato'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)' }}>
              {contrato ? 'Modifica los campos necesarios' : 'Registra un nuevo contrato en ejecución'}
            </p>
          </div>
          <button className="btn-ghost" style={{ padding: 'var(--space-2)' }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6) var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

          <FF label="Número de contrato *">
            <input className="input" required value={form.numeroContrato} onChange={onInput('numeroContrato')} placeholder="C-2026-001" />
          </FF>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FF label="Entidad *">
              <Select value={form.entidadId} onChange={(v) => setForm((f) => ({ ...f, entidadId: v }))} options={entidades} placeholder="Seleccionar..." />
            </FF>
            <FF label="Responsable *">
              <Select value={form.responsableId} onChange={(v) => setForm((f) => ({ ...f, responsableId: v }))} options={usuarios} placeholder="Seleccionar..." />
            </FF>
          </div>

          <FF label="Objeto del contrato *">
            <textarea className="input" required rows={2} value={form.objeto} onChange={onInput('objeto')} placeholder="Descripción del objeto..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </FF>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FF label="Valor total (COP) *">
              <input className="input" type="number" min={0} required value={form.valorTotal} onChange={onInput('valorTotal')} placeholder="1000000000" />
            </FF>
            {contrato && (
              <FF label="Valor ejecutado (COP)">
                <input className="input" type="number" min={0} value={form.valorEjecutado} onChange={onInput('valorEjecutado')} placeholder="0" />
              </FF>
            )}
          </div>

          {contrato && (
            <FF label="Avance físico (%)">
              <input className="input" type="number" min={0} max={100} value={form.avanceFisico} onChange={onInput('avanceFisico')} placeholder="0" />
            </FF>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FF label="Fecha inicio *">
              <input className="input" type="date" required value={form.fechaInicio} onChange={onInput('fechaInicio')} />
            </FF>
            <FF label="Fecha fin *">
              <input className="input" type="date" required value={form.fechaFin} onChange={onInput('fechaFin')} />
            </FF>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FF label="Supervisor nombre">
              <input className="input" value={form.supervisorNombre} onChange={onInput('supervisorNombre')} placeholder="Nombre del supervisor" />
            </FF>
            <FF label="Supervisor email">
              <input className="input" type="email" value={form.supervisorEmail} onChange={onInput('supervisorEmail')} placeholder="supervisor@entidad.gov.co" />
            </FF>
          </div>

          <FF label="Notas">
            <textarea className="input" rows={2} value={form.notas} onChange={onInput('notas')} placeholder="Observaciones..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </FF>

          {err && (
            <div style={{ padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--rojo)', fontSize: 13 }}>
              {err}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 'var(--gap-md)', justifyContent: 'flex-end', padding: 'var(--space-5) var(--space-7)', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Guardando...' : (contrato ? 'Guardar cambios' : 'Crear contrato')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal hito ────────────────────────────────────────────────────────────────
function HitoModal({ hito, onClose, onSaved }: {
  hito: HitoContrato | null;
  onClose: () => void;
  onSaved: (p: CreateHitoPayload | UpdateHitoPayload) => void;
}) {
  const [form, setForm] = useState({
    nombre:        hito?.nombre        ?? '',
    descripcion:   hito?.descripcion   ?? '',
    fechaLimite:   hito?.fechaLimite   ? hito.fechaLimite.slice(0, 10) : '',
    valorAsociado: hito?.valorAsociado ? String(hito.valorAsociado) : '',
    observaciones: hito?.observaciones ?? '',
  });
  const onInput = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(7,7,26,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}
    >
      <div className="glass-prominent" style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{hito ? 'Editar hito' : 'Nuevo hito'}</h2>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
          <FF label="Nombre *">
            <input className="input" required value={form.nombre} onChange={onInput('nombre')} placeholder="Ej: Entrega informe parcial" />
          </FF>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FF label="Fecha límite *">
              <input className="input" type="date" required value={form.fechaLimite} onChange={onInput('fechaLimite')} />
            </FF>
            <FF label="Valor asociado (COP)">
              <input className="input" type="number" min={0} value={form.valorAsociado} onChange={onInput('valorAsociado')} placeholder="0" />
            </FF>
          </div>
          <FF label="Observaciones">
            <textarea className="input" rows={2} value={form.observaciones} onChange={onInput('observaciones')} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </FF>
        </div>
        <div style={{ display: 'flex', gap: 'var(--gap-md)', justifyContent: 'flex-end', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--glass-border)' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!form.nombre || !form.fechaLimite) return;
              onSaved({
                nombre:        form.nombre,
                descripcion:   form.descripcion   || undefined,
                fechaLimite:   form.fechaLimite,
                valorAsociado: form.valorAsociado ? Number(form.valorAsociado) : undefined,
                observaciones: form.observaciones || undefined,
              });
            }}
          >
            {hito ? 'Guardar' : 'Agregar hito'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}
