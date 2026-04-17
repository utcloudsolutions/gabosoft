import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roles';
import { paginationSchema } from '../../lib/pagination';
import { createAliadoSchema, updateAliadoSchema } from './aliados.schemas';
import { listAliados, getAliado, createAliado, updateAliado, deleteAliado } from './aliados.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const soloActivos = req.query.todos !== 'true';
    const pagination  = paginationSchema.parse(req.query);
    res.json(await listAliados(soloActivos, pagination));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getAliado(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = createAliadoSchema.parse(req.body);
    res.status(201).json(await createAliado(body));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = updateAliadoSchema.parse(req.body);
    res.json(await updateAliado(req.params['id'] as string, body));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    await deleteAliado(req.params['id'] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
