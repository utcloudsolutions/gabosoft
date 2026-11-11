import { diasHasta } from '../../lib/fechas';

type Semaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

const MAP: Record<Semaforo, { label: string; color: string; glass: string }> = {
  VERDE: { label: 'Al día', color: 'var(--verde)', glass: 'var(--verde-glass)' },
  AMARILLO: { label: 'En riesgo', color: 'var(--amarillo)', glass: 'var(--amarillo-glass)' },
  ROJO: { label: 'Crìtico / Vencido', color: 'var(--rojo)', glass: 'var(--rojo-glass)' },
};

export function SemaforoBadge({
  value,
  fechaFin,
}: {
  value: Semaforo;
  fechaFin?: string;
}) {
  const semaforo = fechaFin && diasHasta(fechaFin) < 0 ? 'ROJO' : value;
  const { label, color, glass } = MAP[semaforo];
  return (
    <span
      className="badge"
      style={{
        background: glass,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        color,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
      />
      {label}
    </span>
  );
}
