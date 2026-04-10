import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getKpis } from './dashboard.service';

const router = Router();

router.get('/kpis', requireAuth, async (_req, res, next) => {
  try {
    const data = await getKpis();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
