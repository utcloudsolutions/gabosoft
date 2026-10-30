import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = z.flattenError(err);
    res.status(400).json({
      message: 'Datos de entrada inválidos',
      errors: fieldErrors,
      // Errores a nivel raíz, p. ej. body ausente (en Express 5 req.body es undefined)
      ...(formErrors.length > 0 && { formErrors }),
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode < 500 ? err.message : 'Error interno del servidor';

  if (statusCode >= 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({ message });
}

/** Crea un error con código HTTP. */
export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}
