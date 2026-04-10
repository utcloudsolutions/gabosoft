import { api } from './api';

export type EstadoProceso = 'ESTRUCTURACION' | 'PRESENTACION' | 'GANADO' | 'NO_ADJUDICADO' | 'DESIERTO';

export interface Proceso {
  id: string;
  nombre: string;
  numeroProceso?: string;
  objeto?: string;
  estado: EstadoProceso;
  valorEstimado?: number;
  valorAdjudicado?: number;
  fechaApertura?: string;
  fechaCierre?: string;
  fechaAdjudicacion?: string;
  modalidad?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  entidad: { id: string; nombre: string; nit: string; municipio?: string };
  responsable: { id: string; nombre: string; email: string; rol: string };
  aliados: Array<{
    aliadoId: string;
    rolConsorcio?: string;
    porcentajeParticipacion?: number;
    aliado: { id: string; nombre: string; nit?: string; tipo?: string };
  }>;
}

export interface ProcesoListResponse {
  items: Proceso[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateProcesoPayload {
  entidadId: string;
  responsableId: string;
  nombre: string;
  numeroProceso?: string;
  objeto?: string;
  valorEstimado?: number;
  fechaApertura?: string;
  fechaCierre?: string;
  modalidad?: string;
  notas?: string;
  aliadoIds?: string[];
}

export interface CambiarEstadoPayload {
  estado: EstadoProceso;
  comentario?: string;
  valorAdjudicado?: number;
  fechaAdjudicacion?: string;
}

export const procesosApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<ProcesoListResponse>('/procesos', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Proceso>(`/procesos/${id}`).then((r) => r.data),

  create: (payload: CreateProcesoPayload) =>
    api.post<Proceso>('/procesos', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateProcesoPayload>) =>
    api.put<Proceso>(`/procesos/${id}`, payload).then((r) => r.data),

  cambiarEstado: (id: string, payload: CambiarEstadoPayload) =>
    api.patch<Proceso>(`/procesos/${id}/estado`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/procesos/${id}`),
};
