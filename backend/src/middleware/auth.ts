import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface AccessTokenPayload {
  sub: string;
  email: string;
  rol: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de acceso requerido' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol as never };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
