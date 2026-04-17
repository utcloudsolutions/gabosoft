import { prisma } from '../../db/prisma';
import { createError } from '../../middleware/error';
import { paginate, type PaginationParams } from '../../lib/pagination';
import type { z } from 'zod';
import type { createEntidadSchema, updateEntidadSchema } from './entidades.schemas';

export async function listEntidades(soloActivas = true, pagination: PaginationParams) {
  const { page, limit } = pagination;
  const where = soloActivas ? { activo: true } : undefined;

  const [items, total] = await Promise.all([
    prisma.entidad.findMany({
      where,
      orderBy: { nombre: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.entidad.count({ where }),
  ]);

  return paginate(items, total, page, limit);
}

export async function getEntidad(id: string) {
  const entidad = await prisma.entidad.findUnique({ where: { id } });
  if (!entidad) throw createError('Entidad no encontrada', 404);
  return entidad;
}

export async function createEntidad(data: z.infer<typeof createEntidadSchema>) {
  const exists = await prisma.entidad.findUnique({ where: { nit: data.nit } });
  if (exists) throw createError('Ya existe una entidad con ese NIT', 409);
  return prisma.entidad.create({ data });
}

export async function updateEntidad(id: string, data: z.infer<typeof updateEntidadSchema>) {
  const exists = await prisma.entidad.findUnique({ where: { id } });
  if (!exists) throw createError('Entidad no encontrada', 404);

  if (data.nit && data.nit !== exists.nit) {
    const dup = await prisma.entidad.findUnique({ where: { nit: data.nit } });
    if (dup) throw createError('Ya existe una entidad con ese NIT', 409);
  }

  return prisma.entidad.update({ where: { id }, data });
}

export async function deleteEntidad(id: string) {
  const exists = await prisma.entidad.findUnique({ where: { id } });
  if (!exists) throw createError('Entidad no encontrada', 404);
  return prisma.entidad.update({ where: { id }, data: { activo: false } });
}
