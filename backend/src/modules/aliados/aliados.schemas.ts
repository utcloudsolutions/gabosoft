import { z } from 'zod';

export const createAliadoSchema = z.object({
  nombre: z.string().min(2).max(300),
  nit: z.string().max(30).optional(),
  tipo: z.string().max(100).optional(),
  contactoNombre: z.string().max(200).optional(),
  contactoEmail: z.email().optional(),
  contactoTelefono: z.string().max(30).optional(),
});

export const updateAliadoSchema = createAliadoSchema.partial().extend({
  activo: z.boolean().optional(),
});
