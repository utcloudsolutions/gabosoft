import { RolUsuario } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: RolUsuario;
      };
    }
  }
}
