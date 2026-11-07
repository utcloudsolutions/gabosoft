import { EstadoProceso } from '../../generated/prisma/client';
import { prisma } from '../../db/prisma';
import { createError } from '../../middleware/error';
import type { z } from 'zod';
import type {
  createProcesoSchema,
  updateProcesoSchema,
  cambiarEstadoSchema,
  listProcesosSchema,
} from './procesos.schemas';

// ── Transiciones válidas del estado ──────────────────────────────────────────
const TRANSICIONES: Partial<Record<EstadoProceso, EstadoProceso[]>> = {
  ESTRUCTURACION: ['PRESENTACION'],
  PRESENTACION: ['GANADO', 'NO_ADJUDICADO', 'DESIERTO'],
};

function validarTransicion(actual: EstadoProceso, siguiente: EstadoProceso) {
  const permitidos = TRANSICIONES[actual] ?? [];
  if (!permitidos.includes(siguiente)) {
    throw createError(
      `Transición inválida: ${actual} → ${siguiente}. Permitidas: ${permitidos.join(', ') || 'ninguna (estado terminal)'}`,
      400,
    );
  }
}

// ── Include reutilizable ──────────────────────────────────────────────────────
const PROCESO_INCLUDE = {
  entidad: { select: { id: true, nombre: true, nit: true, municipio: true } },
  responsable: { select: { id: true, nombre: true, email: true, rol: true } },
  aliados: {
    include: {
      aliado: { select: { id: true, nombre: true, nit: true, tipo: true } },
    },
  },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────
export async function listProcesos(filters: z.infer<typeof listProcesosSchema>) {
  const { estado, entidadId, responsableId, modalidad, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(estado && { estado }),
    ...(entidadId && { entidadId }),
    ...(responsableId && { responsableId }),
    ...(modalidad && { modalidad: { contains: modalidad, mode: 'insensitive' as const } }),
  };

  const [items, total] = await Promise.all([
    prisma.procesoPrecontractual.findMany({
      where,
      include: PROCESO_INCLUDE,
      orderBy: [{ estado: 'asc' }, { fechaCierre: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.procesoPrecontractual.count({ where }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

// ── Get one ───────────────────────────────────────────────────────────────────
export async function getProceso(id: string) {
  const proceso = await prisma.procesoPrecontractual.findUnique({
    where: { id },
    include: {
      ...PROCESO_INCLUDE,
      historial: {
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!proceso) throw createError('Proceso no encontrado', 404);
  return proceso;
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createProceso(data: z.infer<typeof createProcesoSchema>, usuarioId: string) {
  const { aliadoIds = [], ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const proceso = await tx.procesoPrecontractual.create({
      data: {
        ...rest,
        valorEstimado: rest.valorEstimado ?? undefined,
        fechaApertura: rest.fechaApertura ? new Date(rest.fechaApertura) : undefined,
        fechaCierre: rest.fechaCierre ? new Date(rest.fechaCierre) : undefined,
        aliados: {
          create: aliadoIds.map((aliadoId) => ({ aliadoId })),
        },
      },
      include: PROCESO_INCLUDE,
    });

    // Registro en historial
    await tx.historialProceso.create({
      data: {
        procesoId: proceso.id,
        usuarioId,
        estadoAnterior: null,
        estadoNuevo: 'ESTRUCTURACION',
        comentario: 'Proceso creado',
      },
    });

    return proceso;
  });
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateProceso(id: string, data: z.infer<typeof updateProcesoSchema>) {
  const exists = await prisma.procesoPrecontractual.findUnique({ where: { id } });
  if (!exists) throw createError('Proceso no encontrado', 404);

  const { aliadoIds, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    // Sync aliados si se proveen
    if (aliadoIds !== undefined) {
      await tx.procesoAliado.deleteMany({ where: { procesoId: id } });
      if (aliadoIds.length > 0) {
        await tx.procesoAliado.createMany({
          data: aliadoIds.map((aliadoId) => ({ procesoId: id, aliadoId })),
        });
      }
    }

    return tx.procesoPrecontractual.update({
      where: { id },
      data: {
        ...rest,
        valorEstimado: rest.valorEstimado ?? undefined,
        fechaApertura: rest.fechaApertura ? new Date(rest.fechaApertura) : undefined,
        fechaCierre: rest.fechaCierre ? new Date(rest.fechaCierre) : undefined,
      },
      include: PROCESO_INCLUDE,
    });
  });
}

// ── Cambiar estado (Kanban) ───────────────────────────────────────────────────
export async function cambiarEstado(
  id: string,
  data: z.infer<typeof cambiarEstadoSchema>,
  usuarioId: string,
) {
  const proceso = await prisma.procesoPrecontractual.findUnique({ where: { id } });
  if (!proceso) throw createError('Proceso no encontrado', 404);

  validarTransicion(proceso.estado, data.estado as EstadoProceso);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.procesoPrecontractual.update({
      where: { id },
      data: {
        estado: data.estado as EstadoProceso,
        ...(data.valorAdjudicado && { valorAdjudicado: data.valorAdjudicado }),
        ...(data.fechaAdjudicacion && { fechaAdjudicacion: new Date(data.fechaAdjudicacion) }),
      },
      include: PROCESO_INCLUDE,
    });

    await tx.historialProceso.create({
      data: {
        procesoId: id,
        usuarioId,
        estadoAnterior: proceso.estado,
        estadoNuevo: data.estado as EstadoProceso,
        comentario: data.comentario ?? null,
      },
    });

    return updated;
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteProceso(id: string) {
  const exists = await prisma.procesoPrecontractual.findUnique({ where: { id } });
  if (!exists) throw createError('Proceso no encontrado', 404);
  await prisma.procesoPrecontractual.delete({ where: { id } });
}
