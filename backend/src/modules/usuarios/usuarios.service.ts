import bcrypt from 'bcrypt';
import { prisma } from '../../db/prisma';
import { createError } from '../../middleware/error';
import type { z } from 'zod';
import type { createUsuarioSchema, updateUsuarioSchema } from './usuarios.schemas';

const SALT_ROUNDS = 12;

// Nunca exponer el hash de contraseña ni el refresh token
const SAFE_SELECT = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsuarios() {
  return prisma.usuario.findMany({
    select: SAFE_SELECT,
    orderBy: { nombre: 'asc' },
  });
}

export async function getUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: SAFE_SELECT });
  if (!usuario) throw createError('Usuario no encontrado', 404);
  return usuario;
}

export async function createUsuario(data: z.infer<typeof createUsuarioSchema>) {
  const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (exists) throw createError('Ya existe un usuario con ese correo', 409);

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      passwordHash,
      rol: data.rol,
    },
    select: SAFE_SELECT,
  });
}

export async function updateUsuario(id: string, data: z.infer<typeof updateUsuarioSchema>) {
  const exists = await prisma.usuario.findUnique({ where: { id } });
  if (!exists) throw createError('Usuario no encontrado', 404);

  if (data.email && data.email !== exists.email) {
    const dup = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (dup) throw createError('Ya existe un usuario con ese correo', 409);
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    delete updateData.password;
  }

  return prisma.usuario.update({ where: { id }, data: updateData, select: SAFE_SELECT });
}

export async function deleteUsuario(id: string, requesterId: string) {
  if (id === requesterId) throw createError('No puedes eliminar tu propia cuenta', 400);
  const exists = await prisma.usuario.findUnique({ where: { id } });
  if (!exists) throw createError('Usuario no encontrado', 404);
  return prisma.usuario.update({ where: { id }, data: { activo: false }, select: SAFE_SELECT });
}
