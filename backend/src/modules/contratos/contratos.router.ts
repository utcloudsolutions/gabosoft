import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roles';
import {
  createContratoSchema,
  updateContratoSchema,
  updateSemaforoSchema,
  listContratosSchema,
  createHitoSchema,
  updateHitoSchema,
} from './contratos.schemas';
import {
  listContratos,
  getContrato,
  createContrato,
  updateContrato,
  updateSemaforo,
  deleteContrato,
  createHito,
  updateHito,
  deleteHito,
} from './contratos.service';

const router = Router();
router.use(requireAuth);

// ── Contratos ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    res.json(await listContratos(listContratosSchema.parse(req.query)));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getContrato(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    res.status(201).json(await createContrato(createContratoSchema.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    res.json(
      await updateContrato(req.params['id'] as string, updateContratoSchema.parse(req.body)),
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/semaforo', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    res.json(
      await updateSemaforo(req.params['id'] as string, updateSemaforoSchema.parse(req.body)),
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    res.json(await deleteContrato(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
});

// ── Hitos ─────────────────────────────────────────────────────────────────────
router.post('/:id/hitos', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await createHito(req.params['id'] as string, createHitoSchema.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

router.put('/:id/hitos/:hitoId', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    res.json(
      await updateHito(
        req.params['id'] as string,
        req.params['hitoId'] as string,
        updateHitoSchema.parse(req.body),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/hitos/:hitoId', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    await deleteHito(req.params['id'] as string, req.params['hitoId'] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
