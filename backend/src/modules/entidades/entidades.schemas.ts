import { z } from 'zod';

export const createEntidadSchema = z.object({
  nombre: z.string().min(2).max(300),
  nit: z.string().min(5).max(30),
  tipo: z.string().max(100).optional(),
  municipio: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  contactoNombre: z.string().max(200).optional(),
  contactoEmail: z.string().email().optional(),
  contactoTelefono: z.string().max(30).optional(),
});

export const updateEntidadSchema = createEntidadSchema.partial().extend({
  activo: z.boolean().optional(),
});
