import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roles';
import { createEntidadSchema, updateEntidadSchema } from './entidades.schemas';
import {
  listEntidades,
  getEntidad,
  createEntidad,
  updateEntidad,
  deleteEntidad,
} from './entidades.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const soloActivas = req.query.todas !== 'true';
    res.json(await listEntidades(soloActivas));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getEntidad(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = createEntidadSchema.parse(req.body);
    res.status(201).json(await createEntidad(body));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRoles('ADMIN', 'SUPERVISOR'), async (req, res, next) => {
  try {
    const body = updateEntidadSchema.parse(req.body);
    res.json(await updateEntidad(req.params['id'] as string, body));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    await deleteEntidad(req.params['id'] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
