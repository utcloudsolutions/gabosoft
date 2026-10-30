// Fechas de calendario (columnas @db.Date): el API las envía como medianoche UTC
// ("2027-06-30T00:00:00.000Z"). Con new Date() se interpretarían como un instante y,
// en zonas UTC-x como Colombia, se mostrarían un día antes. Aquí se toma solo la parte
// YYYY-MM-DD y se construye la fecha en hora local.

const MS_DIA = 1000 * 60 * 60 * 24;

/** Convierte "YYYY-MM-DD" o un ISO de fecha de calendario en un Date local a medianoche. */
export function parseFecha(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "30 jun 2027" */
export function fmtFecha(s: string): string {
  return parseFecha(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Días de calendario desde hoy hasta la fecha (0 = hoy, negativo = ya pasó). */
export function diasHasta(s: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((parseFecha(s).getTime() - hoy.getTime()) / MS_DIA);
}
