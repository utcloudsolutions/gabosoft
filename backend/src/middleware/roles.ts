import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';

/**
 * Middleware factory que permite el acceso solo a los roles indicados.
 * Debe usarse después de requireAuth.
 *
 * @example router.get('/admin', requireAuth, requireRoles('ADMIN'), handler)
 */
export function requireRoles(...roles: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    if (!roles.includes(req.user.rol as RolUsuario)) {
      res.status(403).json({ message: 'No tienes permiso para esta acción' });
      return;
    }

    next();
  };
}
