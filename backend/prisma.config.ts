import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Configuración del CLI de Prisma (migrate, studio, seed).
// Las migraciones usan la conexión directa (DIRECT_URL); en local es igual a DATABASE_URL.
// Se lee de process.env (y no con env()) para que `prisma generate` funcione sin BD, p. ej. en CI.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
