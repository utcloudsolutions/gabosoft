import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roles';
import {
  createProcesoSchema,
  updateProcesoSchema,
  cambiarEstadoSchema,
  listProcesosSchema,
} from './procesos.schemas';
import {
  listProcesos,
  getProceso,
  createProceso,
  updateProceso,
  cambiarEstado,
  deleteProceso,
} from './procesos.service';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(requireAuth);

// GET /procesos — listar con filtros y paginación
router.get('/', async (req, res, next) => {
  try {
    const filters = listProcesosSchema.parse(req.query);
    const data = await listProcesos(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /procesos/:id — detalle con historial
router.get('/:id', async (req, res, next) => {
  try {
    const data = await getProceso(req.params['id'] as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /procesos — crear
router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = createProcesoSchema.parse(req.body);
    const data = await createProceso(body, req.user!.id);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /procesos/:id — actualizar campos
router.put('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = updateProcesoSchema.parse(req.body);
    const data = await updateProceso(req.params['id'] as string, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /procesos/:id/estado — Kanban transition
router.patch('/:id/estado', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = cambiarEstadoSchema.parse(req.body);
    const data = await cambiarEstado(req.params['id'] as string, body, req.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /procesos/:id — solo ADMIN
router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    await deleteProceso(req.params['id'] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
