import './config/env'; // valida variables de entorno al arrancar
import { env } from './config/env';
import { prisma } from './db/prisma';
import app from './app';

async function main() {
  // Verificar conexión a BD antes de levantar el servidor
  await prisma.$connect();
  console.log('✅ Conexión a PostgreSQL establecida');

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 TechTransit API corriendo en http://localhost:${env.PORT}/api/v1`);
    console.log(`   Entorno: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recibido, cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Conexión a BD cerrada. Hasta pronto.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
