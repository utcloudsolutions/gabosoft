import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { createError } from '../../middleware/error';
import type { RegisterDto, LoginDto } from './auth.schemas';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface JwtAccessPayload {
  sub: string;
  email: string;
  rol: RolUsuario;
}

// ── Token helpers ──────────────────────────────────────────────────────────────

function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

async function buildTokens(id: string, email: string, rol: RolUsuario): Promise<Tokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: id, email, rol }),
    signRefreshToken(id),
  ]);
  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const hash = await bcrypt.hash(refreshToken, 10);
  await prisma.usuario.update({ where: { id: userId }, data: { refreshToken: hash } });
}

// ── Service methods ────────────────────────────────────────────────────────────

export async function register(dto: RegisterDto): Promise<Tokens> {
  const existing = await prisma.usuario.findUnique({ where: { email: dto.email } });
  if (existing) throw createError('El email ya está registrado', 409);

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const user = await prisma.usuario.create({
    data: { nombre: dto.nombre, email: dto.email, passwordHash },
  });

  const tokens = await buildTokens(user.id, user.email, user.rol);
  await persistRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

export async function login(dto: LoginDto): Promise<Tokens> {
  const user = await prisma.usuario.findUnique({ where: { email: dto.email, activo: true } });
  if (!user) throw createError('Credenciales inválidas', 401);

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw createError('Credenciales inválidas', 401);

  const tokens = await buildTokens(user.id, user.email, user.rol);
  await persistRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

export async function refresh(rawRefreshToken: string): Promise<Tokens> {
  // 1. Verificar firma y expiración
  let payload: { sub: string };
  try {
    payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw createError('Refresh token inválido o expirado', 403);
  }

  // 2. Validar que el hash almacenado coincida
  const user = await prisma.usuario.findUnique({ where: { id: payload.sub, activo: true } });
  if (!user?.refreshToken) throw createError('Acceso denegado', 403);

  const match = await bcrypt.compare(rawRefreshToken, user.refreshToken);
  if (!match) throw createError('Acceso denegado', 403);

  // 3. Rotar tokens
  const tokens = await buildTokens(user.id, user.email, user.rol);
  await persistRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

export async function logout(userId: string): Promise<void> {
  await prisma.usuario.update({ where: { id: userId }, data: { refreshToken: null } });
}
