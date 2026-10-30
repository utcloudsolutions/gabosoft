import { z } from 'zod';

export const createProcesoSchema = z.object({
  entidadId: z.uuid(),
  responsableId: z.uuid(),
  nombre: z.string().min(3).max(300),
  numeroProceso: z.string().max(100).optional(),
  objeto: z.string().max(2000).optional(),
  valorEstimado: z.number().positive().optional(),
  fechaApertura: z.iso.datetime({ offset: true }).optional().or(z.iso.date().optional()),
  fechaCierre: z.iso.datetime({ offset: true }).optional().or(z.iso.date().optional()),
  modalidad: z.string().max(100).optional(),
  notas: z.string().max(5000).optional(),
  aliadoIds: z.array(z.uuid()).optional(),
});

export const updateProcesoSchema = createProcesoSchema.partial();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO']),
  comentario: z.string().max(1000).optional(),
  valorAdjudicado: z.number().positive().optional(),
  fechaAdjudicacion: z.iso.date().optional(),
});

export const listProcesosSchema = z.object({
  estado: z
    .enum(['ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO'])
    .optional(),
  entidadId: z.uuid().optional(),
  responsableId: z.uuid().optional(),
  modalidad: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});
