import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
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

// ── Security & logging ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routers ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',       authRouter);
app.use('/api/v1/dashboard',  dashboardRouter);
app.use('/api/v1/procesos',   procesosRouter);
app.use('/api/v1/entidades',  entidadesRouter);
app.use('/api/v1/aliados',    aliadosRouter);
app.use('/api/v1/usuarios',   usuariosRouter);
app.use('/api/v1/contratos',       contratosRouter);
app.use('/api/v1/notificaciones',  notificacionesRouter);

// ── Global error handler (debe ir al final) ────────────────────────────────────
app.use(errorHandler);

export default app;
