import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error';
import authRouter from './modules/auth/auth.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import procesosRouter from './modules/procesos/procesos.router';
import entidadesRouter from './modules/entidades/entidades.router';
import aliadosRouter from './modules/aliados/aliados.router';
import usuariosRouter from './modules/usuarios/usuarios.router';
import contratosRouter from './modules/contratos/contratos.router';
import notificacionesRouter from './modules/notificaciones/notificaciones.router';

const app = express();

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging estructurado (reemplaza morgan) ───────────────────────────────────
app.use(
  pinoHttp({
    logger,
    // No loguear el health check para no llenar los logs
    autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global: 200 req / 15 min por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intenta más tarde.' },
});

// Estricto para auth: 20 req / 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de autenticación, intenta más tarde.' },
});

app.use(globalLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routers ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/procesos', procesosRouter);
app.use('/api/v1/entidades', entidadesRouter);
app.use('/api/v1/aliados', aliadosRouter);
app.use('/api/v1/usuarios', usuariosRouter);
app.use('/api/v1/contratos', contratosRouter);
app.use('/api/v1/notificaciones', notificacionesRouter);

// ── Global error handler (debe ir al final) ────────────────────────────────────
app.use(errorHandler);

export default app;
