import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roles';
import { createUsuarioSchema, updateUsuarioSchema } from './usuarios.schemas';
import {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from './usuarios.service';

const router = Router();

// Todos los endpoints de usuarios son solo para ADMIN
router.use(requireAuth, requireRoles('ADMIN'));

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listUsuarios());
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getUsuario(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = createUsuarioSchema.parse(req.body);
    res.status(201).json(await createUsuario(body));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const body = updateUsuarioSchema.parse(req.body);
    res.json(await updateUsuario(req.params.id, body));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteUsuario(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
