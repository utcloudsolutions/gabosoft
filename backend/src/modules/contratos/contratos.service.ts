import { SemaforoContrato } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { createError } from '../../middleware/error';
import type { z } from 'zod';
import type {
  createContratoSchema,
  updateContratoSchema,
  updateSemaforoSchema,
  listContratosSchema,
  createHitoSchema,
  updateHitoSchema,
} from './contratos.schemas';

// ── Include reutilizable ──────────────────────────────────────────────────────
const CONTRATO_INCLUDE = {
  entidad:    { select: { id: true, nombre: true, nit: true, municipio: true } },
  responsable:{ select: { id: true, nombre: true, email: true } },
  proceso:    { select: { id: true, nombre: true, numeroProceso: true } },
  hitos:      { orderBy: { fechaLimite: 'asc' as const } },
} as const;

// ── Semáforo automático ───────────────────────────────────────────────────────
export function calcularSemaforo(
  avanceFisico: number,
  fechaFin: Date,
  fechaFinReal?: Date | null,
): SemaforoContrato {
  // Si ya terminó en tiempo → VERDE
  if (fechaFinReal && fechaFinReal <= fechaFin) return 'VERDE';

  const hoy       = new Date();
  const fin       = fechaFin;
  const diasTotal = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  // Vencido
  if (hoy > fin && !fechaFinReal) return 'ROJO';

  // Avance físico vs tiempo transcurrido
  const inicioEjercicio   = new Date(fin.getFullYear(), 0, 1);
  const tiempoTotalDias   = Math.ceil((fin.getTime() - inicioEjercicio.getTime()) / (1000 * 60 * 60 * 24));
  const tiempoElapsedDias = Math.ceil((hoy.getTime()  - inicioEjercicio.getTime()) / (1000 * 60 * 60 * 24));
  const avanceEsperado    = tiempoTotalDias > 0 ? (tiempoElapsedDias / tiempoTotalDias) * 100 : 0;
  const brecha            = avanceEsperado - avanceFisico;

  if (diasTotal <= 15 || brecha > 20) return 'ROJO';
  if (brecha > 10)                    return 'AMARILLO';
  return 'VERDE';
}

// ── List ──────────────────────────────────────────────────────────────────────
export async function listContratos(filters: z.infer<typeof listContratosSchema>) {
  const { semaforo, entidadId, responsableId, activo, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(semaforo      && { semaforo }),
    ...(entidadId     && { entidadId }),
    ...(responsableId && { responsableId }),
    activo: activo === 'true',
  };

  const [items, total] = await Promise.all([
    prisma.contrato.findMany({
      where,
      include: CONTRATO_INCLUDE,
      orderBy: [{ semaforo: 'desc' }, { fechaFin: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.contrato.count({ where }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

// ── Get one ───────────────────────────────────────────────────────────────────
export async function getContrato(id: string) {
  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: CONTRATO_INCLUDE,
  });
  if (!contrato) throw createError('Contrato no encontrado', 404);
  return contrato;
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createContrato(data: z.infer<typeof createContratoSchema>) {
  const dup = await prisma.contrato.findUnique({ where: { numeroContrato: data.numeroContrato } });
  if (dup) throw createError('Ya existe un contrato con ese número', 409);

  const fechaFin = new Date(data.fechaFin);
  const semaforo = calcularSemaforo(0, fechaFin);

  return prisma.contrato.create({
    data: {
      ...data,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin,
      semaforo,
    },
    include: CONTRATO_INCLUDE,
  });
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateContrato(id: string, data: z.infer<typeof updateContratoSchema>) {
  const exists = await prisma.contrato.findUnique({ where: { id } });
  if (!exists) throw createError('Contrato no encontrado', 404);

  if (data.numeroContrato && data.numeroContrato !== exists.numeroContrato) {
    const dup = await prisma.contrato.findUnique({ where: { numeroContrato: data.numeroContrato } });
    if (dup) throw createError('Ya existe un contrato con ese número', 409);
  }

  const avanceFisico = data.avanceFisico ?? Number(exists.avanceFisico);
  const fechaFin     = data.fechaFin ? new Date(data.fechaFin) : exists.fechaFin;
  const fechaFinReal = data.fechaFinReal ? new Date(data.fechaFinReal) : exists.fechaFinReal;

  // Recalcular semáforo si cambia avance o fechas
  const semaforoAuto = calcularSemaforo(avanceFisico, fechaFin, fechaFinReal);

  return prisma.contrato.update({
    where: { id },
    data: {
      ...data,
      ...(data.fechaInicio  && { fechaInicio:  new Date(data.fechaInicio) }),
      ...(data.fechaFin     && { fechaFin }),
      ...(data.fechaFinReal && { fechaFinReal }),
      semaforo: semaforoAuto,
    },
    include: CONTRATO_INCLUDE,
  });
}

// ── Update semáforo manual ────────────────────────────────────────────────────
export async function updateSemaforo(id: string, data: z.infer<typeof updateSemaforoSchema>) {
  const exists = await prisma.contrato.findUnique({ where: { id } });
  if (!exists) throw createError('Contrato no encontrado', 404);
  return prisma.contrato.update({
    where: { id },
    data:  { semaforo: data.semaforo as SemaforoContrato },
    include: CONTRATO_INCLUDE,
  });
}

// ── Delete (soft) ─────────────────────────────────────────────────────────────
export async function deleteContrato(id: string) {
  const exists = await prisma.contrato.findUnique({ where: { id } });
  if (!exists) throw createError('Contrato no encontrado', 404);
  return prisma.contrato.update({ where: { id }, data: { activo: false }, include: CONTRATO_INCLUDE });
}

// ── Hitos ─────────────────────────────────────────────────────────────────────
export async function createHito(contratoId: string, data: z.infer<typeof createHitoSchema>) {
  const exists = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!exists) throw createError('Contrato no encontrado', 404);

  return prisma.hitoContrato.create({
    data: {
      ...data,
      contratoId,
      fechaLimite: new Date(data.fechaLimite),
    },
  });
}

export async function updateHito(
  contratoId: string,
  hitoId: string,
  data: z.infer<typeof updateHitoSchema>,
) {
  const hito = await prisma.hitoContrato.findFirst({ where: { id: hitoId, contratoId } });
  if (!hito) throw createError('Hito no encontrado', 404);

  return prisma.hitoContrato.update({
    where: { id: hitoId },
    data: {
      ...data,
      ...(data.fechaLimite      && { fechaLimite:      new Date(data.fechaLimite) }),
      ...(data.fechaCumplimiento && { fechaCumplimiento: new Date(data.fechaCumplimiento) }),
    },
  });
}

export async function deleteHito(contratoId: string, hitoId: string) {
  const hito = await prisma.hitoContrato.findFirst({ where: { id: hitoId, contratoId } });
  if (!hito) throw createError('Hito no encontrado', 404);
  await prisma.hitoContrato.delete({ where: { id: hitoId } });
}
