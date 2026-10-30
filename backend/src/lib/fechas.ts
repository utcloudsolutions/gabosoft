// Utilidades para fechas de calendario (columnas @db.Date).
// Prisma las devuelve como medianoche UTC; para compararlas con "hoy" hay que usar
// la fecha actual de Colombia en ese mismo formato, no new Date() (que es un instante).

const ZONA_HORARIA = 'America/Bogota';
const MS_DIA = 1000 * 60 * 60 * 24;

/** Fecha de hoy en Colombia, a medianoche UTC (mismo formato que @db.Date). */
export function hoyFecha(): Date {
  // en-CA formatea como YYYY-MM-DD
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_DIA);
}

/** Días de calendario entre dos fechas @db.Date (negativo si `hasta` es anterior). */
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / MS_DIA);
}

/** Días desde hoy (Colombia) hasta la fecha: 0 = hoy, negativo = ya pasó. */
export function diasHasta(fecha: Date): number {
  return diasEntre(hoyFecha(), fecha);
}
