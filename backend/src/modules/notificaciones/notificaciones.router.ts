import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getNotificaciones, getConteo } from './notificaciones.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getNotificaciones());
  } catch (err) {
    next(err);
  }
});

router.get('/conteo', async (_req, res, next) => {
  try {
    res.json({ count: await getConteo() });
  } catch (err) {
    next(err);
  }
});

export default router;
