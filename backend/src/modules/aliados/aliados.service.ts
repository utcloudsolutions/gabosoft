import { prisma } from '../../db/prisma';
import { createError } from '../../middleware/error';
import { paginate, type PaginationParams } from '../../lib/pagination';
import type { z } from 'zod';
import type { createAliadoSchema, updateAliadoSchema } from './aliados.schemas';

export async function listAliados(soloActivos = true, pagination: PaginationParams) {
  const { page, limit } = pagination;
  const where = soloActivos ? { activo: true } : undefined;

  const [items, total] = await Promise.all([
    prisma.aliado.findMany({
      where,
      orderBy: { nombre: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aliado.count({ where }),
  ]);

  return paginate(items, total, page, limit);
}

export async function getAliado(id: string) {
  const aliado = await prisma.aliado.findUnique({ where: { id } });
  if (!aliado) throw createError('Aliado no encontrado', 404);
  return aliado;
}

export async function createAliado(data: z.infer<typeof createAliadoSchema>) {
  if (data.nit) {
    const exists = await prisma.aliado.findUnique({ where: { nit: data.nit } });
    if (exists) throw createError('Ya existe un aliado con ese NIT', 409);
  }
  return prisma.aliado.create({ data });
}

export async function updateAliado(id: string, data: z.infer<typeof updateAliadoSchema>) {
  const exists = await prisma.aliado.findUnique({ where: { id } });
  if (!exists) throw createError('Aliado no encontrado', 404);

  if (data.nit && data.nit !== exists.nit) {
    const dup = await prisma.aliado.findUnique({ where: { nit: data.nit } });
    if (dup) throw createError('Ya existe un aliado con ese NIT', 409);
  }

  return prisma.aliado.update({ where: { id }, data });
}

export async function deleteAliado(id: string) {
  const exists = await prisma.aliado.findUnique({ where: { id } });
  if (!exists) throw createError('Aliado no encontrado', 404);
  return prisma.aliado.update({ where: { id }, data: { activo: false } });
}
