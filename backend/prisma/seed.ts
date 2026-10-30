import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEV_USERS = [
  { nombre: 'Admin Dev',       email: 'admin@techtransit.dev',       password: 'Admin1234!',  rol: 'ADMIN'       as const },
  { nombre: 'Supervisor Dev',  email: 'supervisor@techtransit.dev',  password: 'Super1234!',  rol: 'SUPERVISOR'  as const },
  { nombre: 'Colaborador Dev', email: 'colaborador@techtransit.dev', password: 'Colab1234!',  rol: 'COLABORADOR' as const },
];

async function main() {
  console.log('🌱 Ejecutando seed de credenciales dev...\n');

  for (const u of DEV_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);

    await prisma.usuario.upsert({
      where:  { email: u.email },
      update: { nombre: u.nombre, passwordHash, rol: u.rol, activo: true },
      create: { nombre: u.nombre, email: u.email, passwordHash, rol: u.rol },
    });

    console.log(`  ✅  ${u.rol.padEnd(12)} | ${u.email.padEnd(36)} | ${u.password}`);
  }

  console.log('\n✔ Seed completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
