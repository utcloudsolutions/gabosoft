type EstadoProceso = 'ESTRUCTURACION' | 'PRESENTACION' | 'GANADO' | 'NO_ADJUDICADO' | 'DESIERTO';

const MAP: Record<EstadoProceso, { label: string; color: string }> = {
  ESTRUCTURACION: { label: 'Estructuración', color: 'var(--estado-estructuracion)' },
  PRESENTACION:   { label: 'Presentación',   color: 'var(--estado-presentacion)' },
  GANADO:         { label: 'Ganado',          color: 'var(--estado-ganado)' },
  NO_ADJUDICADO:  { label: 'No adjudicado',   color: 'var(--estado-no-adjudicado)' },
  DESIERTO:       { label: 'Desierto',        color: 'var(--estado-desierto)' },
};

export function EstadoBadge({ value }: { value: EstadoProceso }) {
  const { label, color } = MAP[value];
  return (
    <span
      className="badge"
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}
