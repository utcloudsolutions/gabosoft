import { z } from 'zod';

export const createContratoSchema = z.object({
  procesoId:        z.uuid().optional(),
  entidadId:        z.uuid(),
  responsableId:    z.uuid(),
  numeroContrato:   z.string().min(1).max(100),
  objeto:           z.string().min(3).max(2000),
  valorTotal:       z.number().positive(),
  fechaInicio:      z.string().date(),
  fechaFin:         z.string().date(),
  supervisorNombre: z.string().max(200).optional(),
  supervisorEmail:  z.email().optional(),
  notas:            z.string().max(5000).optional(),
});

export const updateContratoSchema = createContratoSchema.partial().extend({
  valorEjecutado: z.number().min(0).optional(),
  avanceFisico:   z.number().min(0).max(100).optional(),
  fechaFinReal:   z.string().date().optional(),
  activo:         z.boolean().optional(),
});

export const updateSemaforoSchema = z.object({
  semaforo:  z.enum(['VERDE', 'AMARILLO', 'ROJO']),
  comentario: z.string().max(500).optional(),
});

export const listContratosSchema = z.object({
  semaforo:      z.enum(['VERDE', 'AMARILLO', 'ROJO']).optional(),
  entidadId:     z.uuid().optional(),
  responsableId: z.uuid().optional(),
  activo:        z.enum(['true', 'false']).default('true'),
  page:          z.coerce.number().int().min(1).default(1),
  limit:         z.coerce.number().int().min(1).max(200).default(50),
});

// ── Hitos ─────────────────────────────────────────────────────────────────────
export const createHitoSchema = z.object({
  nombre:       z.string().min(2).max(300),
  descripcion:  z.string().max(1000).optional(),
  fechaLimite:  z.string().date(),
  valorAsociado: z.number().positive().optional(),
  observaciones: z.string().max(1000).optional(),
});

export const updateHitoSchema = createHitoSchema.partial().extend({
  estado:           z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'VENCIDO']).optional(),
  fechaCumplimiento: z.string().date().optional(),
});
