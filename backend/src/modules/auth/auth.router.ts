import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as authService from './auth.service';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = registerSchema.parse(req.body);
    const tokens = await authService.register(dto);
    res.status(201).json(tokens);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = loginSchema.parse(req.body);
    const tokens = await authService.login(dto);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout  (requiere access token válido)
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
