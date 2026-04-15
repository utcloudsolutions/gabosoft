import { prisma } from '../../db/prisma';

export type Severidad = 'danger' | 'warning' | 'info';

export interface Notificacion {
  id:          string;
  tipo:        string;
  severidad:   Severidad;
  titulo:      string;
  descripcion: string;
  entidad:     string;
  enlace:      string;
  fecha:       string;
}

function diasRestantes(fecha: Date): number {
  return Math.ceil((fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const hoy       = new Date();
  const en30dias  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const en15dias  = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const [contratosRojo, contratosVencen, hitosVencidos, procesosVencen] = await Promise.all([
    // Contratos con semáforo ROJO activos
    prisma.contrato.findMany({
      where:   { activo: true, semaforo: 'ROJO' },
      include: { entidad: { select: { nombre: true } } },
      orderBy: { fechaFin: 'asc' },
    }),

    // Contratos que vencen en los próximos 30 días (VERDE o AMARILLO)
    prisma.contrato.findMany({
      where: {
        activo: true,
        semaforo: { in: ['VERDE', 'AMARILLO'] },
        fechaFin: { gte: hoy, lte: en30dias },
      },
      include: { entidad: { select: { nombre: true } } },
      orderBy: { fechaFin: 'asc' },
    }),

    // Hitos vencidos no completados
    prisma.hitoContrato.findMany({
      where: {
        estado:      { in: ['PENDIENTE', 'EN_PROGRESO'] },
        fechaLimite: { lt: hoy },
      },
      include: {
        contrato: { select: { id: true, numeroContrato: true, objeto: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    }),

    // Procesos activos con fechaCierre en los próximos 15 días
    prisma.procesoPrecontractual.findMany({
      where: {
        estado:      { in: ['ESTRUCTURACION', 'PRESENTACION'] },
        fechaCierre: { gte: hoy, lte: en15dias },
      },
      include: { entidad: { select: { nombre: true } } },
      orderBy: { fechaCierre: 'asc' },
    }),
  ]);

  const resultado: Notificacion[] = [];
  let seq = 0;

  // ── Contratos en rojo ────────────────────────────────────────────────────────
  for (const c of contratosRojo) {
    const dias = diasRestantes(c.fechaFin);
    resultado.push({
      id:          `contrato-rojo-${c.id}`,
      tipo:        'Contrato en riesgo',
      severidad:   'danger',
      titulo:      `Contrato ${c.numeroContrato} — semáforo ROJO`,
      descripcion: dias < 0
        ? `Venció hace ${Math.abs(dias)} días. ${c.objeto}`
        : `Vence en ${dias} días. ${c.objeto}`,
      entidad:     c.entidad.nombre,
      enlace:      '/contratos',
      fecha:       c.fechaFin.toISOString(),
    });
    seq++;
  }

  // ── Contratos próximos a vencer ───────────────────────────────────────────────
  for (const c of contratosVencen) {
    const dias = diasRestantes(c.fechaFin);
    resultado.push({
      id:          `contrato-vence-${c.id}`,
      tipo:        'Contrato por vencer',
      severidad:   dias <= 7 ? 'danger' : 'warning',
      titulo:      `Contrato ${c.numeroContrato} vence en ${dias} días`,
      descripcion: c.objeto,
      entidad:     c.entidad.nombre,
      enlace:      '/contratos',
      fecha:       c.fechaFin.toISOString(),
    });
    seq++;
  }

  // ── Hitos vencidos ────────────────────────────────────────────────────────────
  for (const h of hitosVencidos) {
    const dias = diasRestantes(h.fechaLimite);
    resultado.push({
      id:          `hito-vencido-${h.id}`,
      tipo:        'Hito vencido',
      severidad:   'danger',
      titulo:      `Hito vencido: ${h.nombre}`,
      descripcion: `Contrato ${h.contrato.numeroContrato} · Venció hace ${Math.abs(dias)} días`,
      entidad:     h.contrato.objeto,
      enlace:      '/contratos',
      fecha:       h.fechaLimite.toISOString(),
    });
    seq++;
  }

  // ── Procesos próximos a cierre ────────────────────────────────────────────────
  for (const p of procesosVencen) {
    const dias = diasRestantes(p.fechaCierre!);
    resultado.push({
      id:          `proceso-cierre-${p.id}`,
      tipo:        'Proceso por cerrar',
      severidad:   dias <= 5 ? 'danger' : 'warning',
      titulo:      `Cierre de licitación en ${dias} días`,
      descripcion: p.nombre,
      entidad:     p.entidad.nombre,
      enlace:      '/precontractual',
      fecha:       p.fechaCierre!.toISOString(),
    });
    seq++;
  }

  // Ordenar: danger primero, luego por fecha
  return resultado.sort((a, b) => {
    if (a.severidad === 'danger' && b.severidad !== 'danger') return -1;
    if (b.severidad === 'danger' && a.severidad !== 'danger') return 1;
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });
}

export async function getConteo(): Promise<number> {
  const notifs = await getNotificaciones();
  return notifs.length;
}
