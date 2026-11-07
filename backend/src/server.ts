import './config/env'; // valida variables de entorno al arrancar
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './db/prisma';
import app from './app';

async function main() {
  await prisma.$connect();
  logger.info('Conexión a PostgreSQL establecida');

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TechTransit API iniciada');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Señal recibida, cerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Conexión a BD cerrada. Hasta pronto.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Error al iniciar el servidor');
  process.exit(1);
});
