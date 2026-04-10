import { z } from 'zod';

export const createProcesoSchema = z.object({
  entidadId: z.string().uuid(),
  responsableId: z.string().uuid(),
  nombre: z.string().min(3).max(300),
  numeroProceso: z.string().max(100).optional(),
  objeto: z.string().max(2000).optional(),
  valorEstimado: z.number().positive().optional(),
  fechaApertura: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  fechaCierre: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  modalidad: z.string().max(100).optional(),
  notas: z.string().max(5000).optional(),
  aliadoIds: z.array(z.string().uuid()).optional(),
});

export const updateProcesoSchema = createProcesoSchema.partial();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO']),
  comentario: z.string().max(1000).optional(),
  valorAdjudicado: z.number().positive().optional(),
  fechaAdjudicacion: z.string().date().optional(),
});

export const listProcesosSchema = z.object({
  estado: z
    .enum(['ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO'])
    .optional(),
  entidadId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
  modalidad: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});
