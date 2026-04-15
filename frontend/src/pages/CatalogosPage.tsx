import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, RefreshCw, X, Pencil, PowerOff, Building2, Users2, Phone, Mail } from 'lucide-react';
import {
  entidadesApi, aliadosApi,
  type Entidad, type Aliado,
  type CreateEntidadPayload, type UpdateEntidadPayload,
  type CreateAliadoPayload,  type UpdateAliadoPayload,
} from '../lib/api.catalogos';
import { useAuthStore } from '../store/authStore';

// ── Tipos de pestaña ──────────────────────────────────────────────────────────
type Tab = 'entidades' | 'aliados';

const TIPO_ENTIDAD_OPTIONS = [
  'Ministerio', 'Departamento', 'Municipio', 'Empresa Industrial y Comercial del Estado',
  'Establecimiento Público', 'Empresa de Servicios Públicos', 'Otro',
];

const TIPO_ALIADO_OPTIONS = [
  'Consorcio', 'Unión Temporal', 'Persona Natural', 'Persona Jurídica', 'Otro',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export function CatalogosPage() {
  const [tab, setTab] = useState<Tab>('entidades');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--gap-lg)' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: 3, width: 'fit-content' }}>
        <TabBtn active={tab === 'entidades'} icon={<Building2 size={13} />} label="Entidades" onClick={() => setTab('entidades')} />
        <TabBtn active={tab === 'aliados'}   icon={<Users2    size={13} />} label="Aliados"   onClick={() => setTab('aliados')}   />
      </div>

      {/* Contenido */}
      {tab === 'entidades' ? <EntidadesTab /> : <AliadosTab />}
    </div>
  );
}

function TabBtn({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
        background: active ? 'var(--primary)' : 'transparent',
        color:      active ? '#fff' : 'var(--text-muted)',
        boxShadow:  active ? '0 0 16px var(--primary-glow)' : 'none',
        transition: 'all 180ms ease',
      }}
    >
      {icon} {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab Entidades
// ═══════════════════════════════════════════════════════════════════════════════
function EntidadesTab() {
  const [items,      setItems]      = useState<Entidad[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showTodas,  setShowTodas]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState<Entidad | null>(null);
  const user     = useAuthStore((s) => s.user);
  const canWrite = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await entidadesApi.list(!showTodas)); }
    finally { setLoading(false); }
  }, [showTodas]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (e: Entidad) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === e.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = e; return n; }
      return [e, ...prev];
    });
    setShowModal(false); setEditItem(null);
  };

  const handleDeactivate = async (id: string) => {
    await entidadesApi.deactivate(id);
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, activo: false } : x));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)', minHeight: 0 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{items.length} entidad{items.length !== 1 ? 'es' : ''}</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showTodas}
              onChange={(e) => setShowTodas(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Mostrar inactivas</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}><RefreshCw size={13} /></button>
          {canWrite && (
            <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
              <Plus size={14} /> Nueva entidad
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? <LoadingCenter /> : (
        <div className="list-glass" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Cabecera */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: 'var(--gap-md)', padding: 'var(--space-2) var(--space-5)', borderBottom: '1px solid var(--glass-border)' }}>
            {['Nombre / NIT', 'Tipo', 'Municipio', 'Contacto', ''].map((h) => (
              <span key={h} style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {items.length === 0 && (
            <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay entidades registradas
            </div>
          )}

          {items.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto',
                gap: 'var(--gap-md)', alignItems: 'center',
                padding: 'var(--space-3) var(--space-5)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                opacity: e.activo ? 1 : 0.45,
                transition: 'background 150ms',
              }}
              onMouseEnter={(el) => { (el.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(el) => { (el.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>NIT: {e.nit}</p>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{e.tipo ?? '—'}</span>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{e.municipio ?? '—'}</p>
                {e.departamento && <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.departamento}</p>}
              </div>
              <div>
                {e.contactoNombre && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.contactoNombre}</p>
                )}
                {e.contactoEmail && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Mail size={10} /> {e.contactoEmail}
                  </p>
                )}
                {e.contactoTelefono && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Phone size={10} /> {e.contactoTelefono}
                  </p>
                )}
              </div>
              {canWrite ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" style={{ padding: '5px 7px' }} onClick={() => { setEditItem(e); setShowModal(true); }}>
                    <Pencil size={12} />
                  </button>
                  {e.activo && (
                    <button className="btn-ghost" style={{ padding: '5px 7px', color: 'var(--rojo)' }} onClick={() => handleDeactivate(e.id)}>
                      <PowerOff size={12} />
                    </button>
                  )}
                </div>
              ) : <span />}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EntidadModal
          entidad={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab Aliados
// ═══════════════════════════════════════════════════════════════════════════════
function AliadosTab() {
  const [items,     setItems]     = useState<Aliado[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showTodos, setShowTodos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<Aliado | null>(null);
  const user     = useAuthStore((s) => s.user);
  const canWrite = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await aliadosApi.list(!showTodos)); }
    finally { setLoading(false); }
  }, [showTodos]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (a: Aliado) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = a; return n; }
      return [a, ...prev];
    });
    setShowModal(false); setEditItem(null);
  };

  const handleDeactivate = async (id: string) => {
    await aliadosApi.deactivate(id);
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, activo: false } : x));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)', minHeight: 0 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{items.length} aliado{items.length !== 1 ? 's' : ''}</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showTodos}
              onChange={(e) => setShowTodos(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Mostrar inactivos</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}><RefreshCw size={13} /></button>
          {canWrite && (
            <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
              <Plus size={14} /> Nuevo aliado
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? <LoadingCenter /> : (
        <div className="list-glass" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: 'var(--gap-md)', padding: 'var(--space-2) var(--space-5)', borderBottom: '1px solid var(--glass-border)' }}>
            {['Nombre / NIT', 'Tipo', 'Estado', 'Contacto', ''].map((h) => (
              <span key={h} style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {items.length === 0 && (
            <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay aliados registrados
            </div>
          )}

          {items.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto',
                gap: 'var(--gap-md)', alignItems: 'center',
                padding: 'var(--space-3) var(--space-5)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                opacity: a.activo ? 1 : 0.45,
                transition: 'background 150ms',
              }}
              onMouseEnter={(el) => { (el.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(el) => { (el.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</p>
                {a.nit && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>NIT: {a.nit}</p>}
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.tipo ?? '—'}</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 500,
                color: a.activo ? 'var(--verde)' : 'var(--text-muted)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.activo ? 'var(--verde)' : 'var(--text-muted)', flexShrink: 0 }} />
                {a.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div>
                {a.contactoNombre && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.contactoNombre}</p>
                )}
                {a.contactoEmail && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Mail size={10} /> {a.contactoEmail}
                  </p>
                )}
                {a.contactoTelefono && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Phone size={10} /> {a.contactoTelefono}
                  </p>
                )}
              </div>
              {canWrite ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" style={{ padding: '5px 7px' }} onClick={() => { setEditItem(a); setShowModal(true); }}>
                    <Pencil size={12} />
                  </button>
                  {a.activo && (
                    <button className="btn-ghost" style={{ padding: '5px 7px', color: 'var(--rojo)' }} onClick={() => handleDeactivate(a.id)}>
                      <PowerOff size={12} />
                    </button>
                  )}
                </div>
              ) : <span />}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AliadoModal
          aliado={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Modal Entidad ─────────────────────────────────────────────────────────────
type EntidadForm = {
  nombre: string; nit: string; tipo: string;
  municipio: string; departamento: string;
  contactoNombre: string; contactoEmail: string; contactoTelefono: string;
};

function EntidadModal({ entidad, onClose, onSaved }: {
  entidad: Entidad | null;
  onClose: () => void;
  onSaved: (e: Entidad) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const [form, setForm] = useState<EntidadForm>({
    nombre:           entidad?.nombre            ?? '',
    nit:              entidad?.nit               ?? '',
    tipo:             entidad?.tipo              ?? '',
    municipio:        entidad?.municipio         ?? '',
    departamento:     entidad?.departamento      ?? '',
    contactoNombre:   entidad?.contactoNombre    ?? '',
    contactoEmail:    entidad?.contactoEmail     ?? '',
    contactoTelefono: entidad?.contactoTelefono  ?? '',
  });

  const onInput = (k: keyof EntidadForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.nombre || !form.nit) { setErr('Nombre y NIT son obligatorios.'); return; }
    setSaving(true); setErr('');
    try {
      const payload: CreateEntidadPayload = {
        nombre: form.nombre, nit: form.nit,
        tipo:             form.tipo             || undefined,
        municipio:        form.municipio        || undefined,
        departamento:     form.departamento     || undefined,
        contactoNombre:   form.contactoNombre   || undefined,
        contactoEmail:    form.contactoEmail    || undefined,
        contactoTelefono: form.contactoTelefono || undefined,
      };
      const saved = entidad
        ? await entidadesApi.update(entidad.id, payload as UpdateEntidadPayload)
        : await entidadesApi.create(payload);
      onSaved(saved);
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <ModalOverlay overlayRef={overlayRef} onClose={onClose}>
      <ModalShell
        title={entidad ? 'Editar entidad' : 'Nueva entidad'}
        subtitle={entidad ? 'Modifica los datos de la entidad' : 'Registra una nueva entidad contratante'}
        onClose={onClose}
        onSubmit={handleSubmit}
        saving={saving}
        err={err}
        submitLabel={entidad ? 'Guardar cambios' : 'Crear entidad'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-md)' }}>
          <FF label="Nombre *">
            <input className="input" required value={form.nombre} onChange={onInput('nombre')} placeholder="Gobernación de Cundinamarca" />
          </FF>
          <FF label="NIT *">
            <input className="input" required value={form.nit} onChange={onInput('nit')} placeholder="800123456-7" />
          </FF>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-md)' }}>
          <FF label="Tipo">
            <select className="input" value={form.tipo} onChange={onInput('tipo')}>
              <option value="">Sin especificar</option>
              {TIPO_ENTIDAD_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FF>
          <FF label="Municipio">
            <input className="input" value={form.municipio} onChange={onInput('municipio')} placeholder="Bogotá D.C." />
          </FF>
          <FF label="Departamento">
            <input className="input" value={form.departamento} onChange={onInput('departamento')} placeholder="Cundinamarca" />
          </FF>
        </div>

        <p className="section-label" style={{ marginTop: 'var(--gap-sm)' }}>Contacto</p>

        <FF label="Nombre del contacto">
          <input className="input" value={form.contactoNombre} onChange={onInput('contactoNombre')} placeholder="Nombre completo" />
        </FF>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
          <FF label="Email">
            <input className="input" type="email" value={form.contactoEmail} onChange={onInput('contactoEmail')} placeholder="contacto@entidad.gov.co" />
          </FF>
          <FF label="Teléfono">
            <input className="input" value={form.contactoTelefono} onChange={onInput('contactoTelefono')} placeholder="601 123 4567" />
          </FF>
        </div>
      </ModalShell>
    </ModalOverlay>
  );
}

// ── Modal Aliado ──────────────────────────────────────────────────────────────
type AliadoForm = {
  nombre: string; nit: string; tipo: string;
  contactoNombre: string; contactoEmail: string; contactoTelefono: string;
};

function AliadoModal({ aliado, onClose, onSaved }: {
  aliado: Aliado | null;
  onClose: () => void;
  onSaved: (a: Aliado) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const [form, setForm] = useState<AliadoForm>({
    nombre:           aliado?.nombre            ?? '',
    nit:              aliado?.nit               ?? '',
    tipo:             aliado?.tipo              ?? '',
    contactoNombre:   aliado?.contactoNombre    ?? '',
    contactoEmail:    aliado?.contactoEmail     ?? '',
    contactoTelefono: aliado?.contactoTelefono  ?? '',
  });

  const onInput = (k: keyof AliadoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.nombre) { setErr('El nombre es obligatorio.'); return; }
    setSaving(true); setErr('');
    try {
      const payload: CreateAliadoPayload = {
        nombre:           form.nombre,
        nit:              form.nit              || undefined,
        tipo:             form.tipo             || undefined,
        contactoNombre:   form.contactoNombre   || undefined,
        contactoEmail:    form.contactoEmail    || undefined,
        contactoTelefono: form.contactoTelefono || undefined,
      };
      const saved = aliado
        ? await aliadosApi.update(aliado.id, payload as UpdateAliadoPayload)
        : await aliadosApi.create(payload);
      onSaved(saved);
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <ModalOverlay overlayRef={overlayRef} onClose={onClose}>
      <ModalShell
        title={aliado ? 'Editar aliado' : 'Nuevo aliado'}
        subtitle={aliado ? 'Modifica los datos del aliado' : 'Registra un nuevo aliado o consorcista'}
        onClose={onClose}
        onSubmit={handleSubmit}
        saving={saving}
        err={err}
        submitLabel={aliado ? 'Guardar cambios' : 'Crear aliado'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-md)' }}>
          <FF label="Nombre *">
            <input className="input" required value={form.nombre} onChange={onInput('nombre')} placeholder="Constructora XYZ S.A.S." />
          </FF>
          <FF label="NIT">
            <input className="input" value={form.nit} onChange={onInput('nit')} placeholder="900123456-1" />
          </FF>
        </div>

        <FF label="Tipo">
          <select className="input" value={form.tipo} onChange={onInput('tipo')}>
            <option value="">Sin especificar</option>
            {TIPO_ALIADO_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FF>

        <p className="section-label" style={{ marginTop: 'var(--gap-sm)' }}>Contacto</p>

        <FF label="Nombre del contacto">
          <input className="input" value={form.contactoNombre} onChange={onInput('contactoNombre')} placeholder="Nombre completo" />
        </FF>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
          <FF label="Email">
            <input className="input" type="email" value={form.contactoEmail} onChange={onInput('contactoEmail')} placeholder="contacto@empresa.com" />
          </FF>
          <FF label="Teléfono">
            <input className="input" value={form.contactoTelefono} onChange={onInput('contactoTelefono')} placeholder="310 123 4567" />
          </FF>
        </div>
      </ModalShell>
    </ModalOverlay>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function ModalOverlay({ overlayRef, onClose, children }: {
  overlayRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(7,7,26,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}
    >
      {children}
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, onSubmit, saving, err, submitLabel, children }: {
  title: string; subtitle: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean; err: string; submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-prominent" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-6) var(--space-7)', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)' }}>{subtitle}</p>
        </div>
        <button className="btn-ghost" style={{ padding: 'var(--space-2)' }} onClick={onClose}><X size={16} /></button>
      </div>
      {/* Body */}
      <form onSubmit={onSubmit} style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6) var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        {children}
        {err && (
          <div style={{ padding: 'var(--pad-btn-sm)', borderRadius: 'var(--radius-md)', background: 'var(--rojo-glass)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--rojo)', fontSize: 13 }}>
            {err}
          </div>
        )}
      </form>
      {/* Footer */}
      <div style={{ display: 'flex', gap: 'var(--gap-md)', justifyContent: 'flex-end', padding: 'var(--space-5) var(--space-7)', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving} onClick={onSubmit}>
          {saving && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
          {saving ? 'Guardando...' : submitLabel}
        </button>
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

function LoadingCenter() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
