import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  rol: z.enum(['ADMIN', 'SUPERVISOR', 'COLABORADOR']).default('COLABORADOR'),
});

export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  rol: z.enum(['ADMIN', 'SUPERVISOR', 'COLABORADOR']).optional(),
  activo: z.boolean().optional(),
});
