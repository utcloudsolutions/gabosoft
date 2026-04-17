import { z } from 'zod';

// ── Schema reutilizable ───────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ── Tipo de respuesta estándar ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ── Helper para construir la respuesta ────────────────────────────────────────
export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
