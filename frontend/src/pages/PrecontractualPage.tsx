import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCw, X, ChevronRight, User, Building2, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { procesosApi, type Proceso, type EstadoProceso, type CreateProcesoPayload } from '../lib/api.procesos';
import { api } from '../lib/api';
import { Select, type SelectOption } from '../components/ui/Select';
import { useAuthStore } from '../store/authStore';

// ── Columnas del Kanban ────────────────────────────────────────────────────────
const COLUMNS: { estado: EstadoProceso; label: string; color: string; glow: string }[] = [
  { estado: 'ESTRUCTURACION', label: 'Estructuración', color: 'var(--estado-estructuracion)', glow: 'rgba(129,140,248,0.18)' },
  { estado: 'PRESENTACION',   label: 'Presentación',   color: 'var(--estado-presentacion)',   glow: 'rgba(59,130,246,0.18)'  },
  { estado: 'GANADO',         label: 'Ganado',          color: 'var(--estado-ganado)',         glow: 'rgba(34,197,94,0.18)'   },
  { estado: 'NO_ADJUDICADO',  label: 'No Adjudicado',  color: 'var(--estado-no-adjudicado)',  glow: 'rgba(245,158,11,0.18)'  },
  { estado: 'DESIERTO',       label: 'Desierto',        color: 'var(--estado-desierto)',       glow: 'rgba(107,114,128,0.18)' },
];

const TRANSICIONES: Partial<Record<EstadoProceso, EstadoProceso[]>> = {
  ESTRUCTURACION: ['PRESENTACION'],
  PRESENTACION:   ['GANADO', 'NO_ADJUDICADO', 'DESIERTO'],
};

const MODALIDADES: SelectOption[] = [
  { value: 'Licitación Pública',    label: 'Licitación Pública'    },
  { value: 'Selección Abreviada',   label: 'Selección Abreviada'   },
  { value: 'Concurso de Méritos',   label: 'Concurso de Méritos'   },
  { value: 'Contratación Directa',  label: 'Contratación Directa'  },
  { value: 'Mínima Cuantía',        label: 'Mínima Cuantía'        },
];

const ESTADO_OPTIONS: SelectOption[] = COLUMNS.map((c) => ({ value: c.estado, label: c.label }));

function fmtCOP(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000)     return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${val.toLocaleString('es-CO')}`;
}

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Hook: entidades y usuarios para selects ───────────────────────────────────
function useSelects() {
  const [entidades, setEntidades] = useState<SelectOption[]>([]);
  const [usuarios,  setUsuarios]  = useState<SelectOption[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ id: string; nombre: string }[]>('/entidades').then((r) => r.data),
      api.get<{ id: string; nombre: string }[]>('/usuarios').then((r) => r.data),
    ])
      .then(([e, u]) => {
        setEntidades(e.map((x) => ({ value: x.id, label: x.nombre })));
        setUsuarios(u.map((x) => ({ value: x.id, label: x.nombre })));
      })
      .catch(() => {});
  }, []);

  return { entidades, usuarios };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export function PrecontractualPage() {
  const [procesos,     setProcesos]     = useState<Proceso[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editProceso,  setEditProceso]  = useState<Proceso | null>(null);
  const [movingId,     setMovingId]     = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState('');
  const user     = useAuthStore((s) => s.user);
  const canWrite = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await procesosApi.list({
        limit: 200,
        ...(filterEstado ? { estado: filterEstado } : {}),
      });
      setProcesos(res.items);
    } catch {
      setError('No se pudo cargar los procesos.');
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { load(); }, [load]);

  const handleMover = async (id: string, estado: EstadoProceso) => {
    setMovingId(id);
    try {
      const updated = await procesosApi.cambiarEstado(id, { estado });
      setProcesos((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al mover proceso';
      alert(msg);
    } finally {
      setMovingId(null);
    }
  };

  const handleSaved = (proceso: Proceso) => {
    setProcesos((prev) => {
      const idx = prev.findIndex((p) => p.id === proceso.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = proceso;
        return next;
      }
      return [proceso, ...prev];
    });
    setShowModal(false);
    setEditProceso(null);
  };

  const byEstado = (estado: EstadoProceso) => procesos.filter((p) => p.estado === estado);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--gap-lg)' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {procesos.length} proceso{procesos.length !== 1 ? 's' : ''} en total
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
          <Select
            value={filterEstado}
            onChange={setFilterEstado}
            options={ESTADO_OPTIONS}
            placeholder="Todos los estados"
            style={{ minWidth: 176 }}
          />
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
            <RefreshCw size={13} />
          </button>
          {canWrite && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Nuevo proceso
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--rojo)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))',
          gap: 'var(--gap-md)',
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          paddingBottom: 'var(--gap-sm)',
        }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.estado}
              col={col}
              items={byEstado(col.estado)}
              movingId={movingId}
              canWrite={canWrite}
              onMover={handleMover}
              onEdit={(p) => { setEditProceso(p); setShowModal(true); }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProcesoModal
          proceso={editProceso}
          onClose={() => { setShowModal(false); setEditProceso(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────
function KanbanColumn({
  col, items, movingId, canWrite, onMover, onEdit,
}: {
  col: typeof COLUMNS[number];
  items: Proceso[];
  movingId: string | null;
  canWrite: boolean;
  onMover: (id: string, estado: EstadoProceso) => void;
  onEdit: (p: Proceso) => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(16px)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--glass-border)',
      overflow: 'hidden',
    }}>
      {/* Column header */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${col.glow}, transparent)`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600 }}>{col.label}</span>
        </div>
        <span style={{ background: col.glow, color: col.color, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-5) 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Vacío
          </div>
        )}
        {items.map((p) => (
          <ProcesoCard
            key={p.id}
            proceso={p}
            isMoving={movingId === p.id}
            canWrite={canWrite}
            onMover={onMover}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

// ── Proceso Card ──────────────────────────────────────────────────────────────
function ProcesoCard({ proceso, isMoving, canWrite, onMover, onEdit }: {
  proceso: Proceso;
  isMoving: boolean;
  canWrite: boolean;
  onMover: (id: string, estado: EstadoProceso) => void;
  onEdit: (p: Proceso) => void;
}) {
  const siguiente = TRANSICIONES[proceso.estado] ?? [];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)',
      opacity: isMoving ? 0.5 : 1,
      transition: 'opacity 200ms',
    }}>
      <p style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>
        {proceso.nombre}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <MetaRow icon={<Building2 size={11} />} text={proceso.entidad.nombre} />
        <MetaRow icon={<User       size={11} />} text={proceso.responsable.nombre} />
        {proceso.fechaCierre && (
          <MetaRow icon={<Calendar size={11} />} text={`Cierre: ${fmtFecha(proceso.fechaCierre)}`} />
        )}
        {proceso.valorEstimado && (
          <MetaRow icon={<DollarSign size={11} />} text={fmtCOP(proceso.valorEstimado)} />
        )}
        {proceso.modalidad && (
          <MetaRow icon={<Tag size={11} />} text={proceso.modalidad} />
        )}
      </div>

      {proceso.aliados.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {proceso.aliados.map((a) => (
            <span key={a.aliadoId} style={{ fontSize: 10, color: 'var(--primary-light)', background: 'var(--primary-glass)', border: '1px solid var(--primary-glow)', borderRadius: 4, padding: '2px 6px' }}>
              {a.aliado.nombre}
            </span>
          ))}
        </div>
      )}

      {canWrite && (
        <div style={{ display: 'flex', gap: 'var(--gap-xs)', flexWrap: 'wrap', marginTop: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 'var(--gap-sm)' }}>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', flex: 1 }} onClick={() => onEdit(proceso)}>
            <FileText size={11} /> Editar
          </button>
          {siguiente.map((est) => (
            <button key={est} className="btn-primary" style={{ fontSize: 11, padding: '4px 8px', flex: 1 }} disabled={isMoving} onClick={() => onMover(proceso.id, est)}>
              {COLUMNS.find((c) => c.estado === est)?.label} <ChevronRight size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

// ── Modal Crear / Editar Proceso ───────────────────────────────────────────────
type FormState = {
  nombre: string;
  entidadId: string;
  responsableId: string;
  numeroProceso: string;
  objeto: string;
  valorEstimado: string;
  fechaCierre: string;
  modalidad: string;
  notas: string;
};

function ProcesoModal({ proceso, onClose, onSaved }: {
  proceso: Proceso | null;
  onClose: () => void;
  onSaved: (p: Proceso) => void;
}) {
  const { entidades, usuarios } = useSelects();
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    nombre:        proceso?.nombre         ?? '',
    entidadId:     proceso?.entidad.id     ?? '',
    responsableId: proceso?.responsable.id ?? '',
    numeroProceso: proceso?.numeroProceso  ?? '',
    objeto:        proceso?.objeto         ?? '',
    valorEstimado: proceso?.valorEstimado  ? String(proceso.valorEstimado) : '',
    fechaCierre:   proceso?.fechaCierre    ? proceso.fechaCierre.slice(0, 10) : '',
    modalidad:     proceso?.modalidad      ?? '',
    notas:         proceso?.notas          ?? '',
  });

  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onInput  = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(k, e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.entidadId || !form.responsableId) {
      setErr('Nombre, entidad y responsable son obligatorios.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const payload: CreateProcesoPayload = {
        nombre:        form.nombre,
        entidadId:     form.entidadId,
        responsableId: form.responsableId,
        numeroProceso: form.numeroProceso  || undefined,
        objeto:        form.objeto         || undefined,
        valorEstimado: form.valorEstimado  ? Number(form.valorEstimado) : undefined,
        fechaCierre:   form.fechaCierre    || undefined,
        modalidad:     form.modalidad      || undefined,
        notas:         form.notas          || undefined,
      };
      const saved = proceso
        ? await procesosApi.update(proceso.id, payload)
        : await procesosApi.create(payload);
      onSaved(saved);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al guardar';
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(7,7,26,0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-5)',
      }}
    >
      <div
        className="glass-prominent"
        style={{
          width: '100%', maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header — fijo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-6) var(--space-7)',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              {proceso ? 'Editar proceso' : 'Nuevo proceso precontractual'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)' }}>
              {proceso ? 'Modifica los campos necesarios' : 'Completa los datos del nuevo proceso'}
            </p>
          </div>
          <button className="btn-ghost" style={{ padding: 'var(--space-2)', flexShrink: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1, overflowY: 'auto',
            padding: 'var(--space-6) var(--space-7)',
            display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)',
          }}
        >
          <FormField label="Nombre del proceso *">
            <input
              className="input"
              required
              value={form.nombre}
              onChange={onInput('nombre')}
              placeholder="Ej: Suministro de equipos de cómputo"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FormField label="Entidad *">
              <Select
                value={form.entidadId}
                onChange={(v) => setField('entidadId', v)}
                options={entidades}
                placeholder="Seleccionar entidad..."
              />
            </FormField>
            <FormField label="Responsable *">
              <Select
                value={form.responsableId}
                onChange={(v) => setField('responsableId', v)}
                options={usuarios}
                placeholder="Seleccionar responsable..."
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FormField label="Número de proceso">
              <input
                className="input"
                value={form.numeroProceso}
                onChange={onInput('numeroProceso')}
                placeholder="SE-2026-001"
              />
            </FormField>
            <FormField label="Modalidad">
              <Select
                value={form.modalidad}
                onChange={(v) => setField('modalidad', v)}
                options={MODALIDADES}
                placeholder="Sin especificar"
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <FormField label="Valor estimado (COP)">
              <input
                className="input"
                type="number"
                min={0}
                value={form.valorEstimado}
                onChange={onInput('valorEstimado')}
                placeholder="500000000"
              />
            </FormField>
            <FormField label="Fecha de cierre">
              <input
                className="input"
                type="date"
                value={form.fechaCierre}
                onChange={onInput('fechaCierre')}
              />
            </FormField>
          </div>

          <FormField label="Objeto">
            <textarea
              className="input"
              value={form.objeto}
              onChange={onInput('objeto')}
              rows={2}
              placeholder="Descripción del objeto contractual..."
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </FormField>

          <FormField label="Notas internas">
            <textarea
              className="input"
              value={form.notas}
              onChange={onInput('notas')}
              rows={2}
              placeholder="Observaciones, estrategia..."
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </FormField>

          {err && (
            <div style={{ padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--rojo)', fontSize: 13 }}>
              {err}
            </div>
          )}
        </form>

        {/* Footer — fijo */}
        <div style={{
          display: 'flex', gap: 'var(--gap-md)', justifyContent: 'flex-end',
          padding: 'var(--space-5) var(--space-7)',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="proceso-form" className="btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving && (
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            )}
            {saving ? 'Guardando...' : (proceso ? 'Guardar cambios' : 'Crear proceso')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
