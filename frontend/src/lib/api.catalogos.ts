import { api } from './api';

// ── Paginación ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ── Entidades ─────────────────────────────────────────────────────────────────
export interface Entidad {
  id:               string;
  nombre:           string;
  nit:              string;
  tipo?:            string;
  municipio?:       string;
  departamento?:    string;
  contactoNombre?:  string;
  contactoEmail?:   string;
  contactoTelefono?: string;
  activo:           boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface CreateEntidadPayload {
  nombre:           string;
  nit:              string;
  tipo?:            string;
  municipio?:       string;
  departamento?:    string;
  contactoNombre?:  string;
  contactoEmail?:   string;
  contactoTelefono?: string;
}

export interface UpdateEntidadPayload extends Partial<CreateEntidadPayload> {
  activo?: boolean;
}

// ── Aliados ───────────────────────────────────────────────────────────────────
export interface Aliado {
  id:               string;
  nombre:           string;
  nit?:             string;
  tipo?:            string;
  contactoNombre?:  string;
  contactoEmail?:   string;
  contactoTelefono?: string;
  activo:           boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface CreateAliadoPayload {
  nombre:           string;
  nit?:             string;
  tipo?:            string;
  contactoNombre?:  string;
  contactoEmail?:   string;
  contactoTelefono?: string;
}

export interface UpdateAliadoPayload extends Partial<CreateAliadoPayload> {
  activo?: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────
export const entidadesApi = {
  list: (todas = false) =>
    api.get<PaginatedResponse<Entidad>>('/entidades', { params: todas ? { todas: 'true' } : {} }).then((r) => r.data),
  create: (payload: CreateEntidadPayload) =>
    api.post<Entidad>('/entidades', payload).then((r) => r.data),
  update: (id: string, payload: UpdateEntidadPayload) =>
    api.put<Entidad>(`/entidades/${id}`, payload).then((r) => r.data),
  deactivate: (id: string) =>
    api.delete(`/entidades/${id}`),
};

export const aliadosApi = {
  list: (todos = false) =>
    api.get<PaginatedResponse<Aliado>>('/aliados', { params: todos ? { todos: 'true' } : {} }).then((r) => r.data),
  create: (payload: CreateAliadoPayload) =>
    api.post<Aliado>('/aliados', payload).then((r) => r.data),
  update: (id: string, payload: UpdateAliadoPayload) =>
    api.put<Aliado>(`/aliados/${id}`, payload).then((r) => r.data),
  deactivate: (id: string) =>
    api.delete(`/aliados/${id}`),
};
