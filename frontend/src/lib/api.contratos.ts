import { api } from './api';

export type SemaforoContrato = 'VERDE' | 'AMARILLO' | 'ROJO';
export type EstadoHito       = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO';

export interface HitoContrato {
  id:                string;
  contratoId:        string;
  nombre:            string;
  descripcion?:      string;
  fechaLimite:       string;
  fechaCumplimiento?: string;
  estado:            EstadoHito;
  valorAsociado?:    number;
  observaciones?:    string;
  createdAt:         string;
  updatedAt:         string;
}

export interface Contrato {
  id:               string;
  numeroContrato:   string;
  objeto:           string;
  valorTotal:       number;
  valorEjecutado:   number;
  avanceFisico:     number;
  semaforo:         SemaforoContrato;
  fechaInicio:      string;
  fechaFin:         string;
  fechaFinReal?:    string;
  supervisorNombre?: string;
  supervisorEmail?:  string;
  notas?:           string;
  activo:           boolean;
  createdAt:        string;
  updatedAt:        string;
  entidad:    { id: string; nombre: string; nit: string; municipio?: string };
  responsable:{ id: string; nombre: string; email: string };
  proceso?:   { id: string; nombre: string; numeroProceso?: string } | null;
  hitos:      HitoContrato[];
}

export interface ContratoListResponse {
  items:  Contrato[];
  total:  number;
  page:   number;
  limit:  number;
  pages:  number;
}

export interface CreateContratoPayload {
  procesoId?:       string;
  entidadId:        string;
  responsableId:    string;
  numeroContrato:   string;
  objeto:           string;
  valorTotal:       number;
  fechaInicio:      string;
  fechaFin:         string;
  supervisorNombre?: string;
  supervisorEmail?:  string;
  notas?:           string;
}

export interface UpdateContratoPayload extends Partial<CreateContratoPayload> {
  valorEjecutado?: number;
  avanceFisico?:   number;
  fechaFinReal?:   string;
  activo?:         boolean;
}

export interface CreateHitoPayload {
  nombre:        string;
  descripcion?:  string;
  fechaLimite:   string;
  valorAsociado?: number;
  observaciones?: string;
}

export interface UpdateHitoPayload extends Partial<CreateHitoPayload> {
  estado?:            EstadoHito;
  fechaCumplimiento?: string;
}

export const contratosApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<ContratoListResponse>('/contratos', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Contrato>(`/contratos/${id}`).then((r) => r.data),

  create: (payload: CreateContratoPayload) =>
    api.post<Contrato>('/contratos', payload).then((r) => r.data),

  update: (id: string, payload: UpdateContratoPayload) =>
    api.put<Contrato>(`/contratos/${id}`, payload).then((r) => r.data),

  updateSemaforo: (id: string, semaforo: SemaforoContrato) =>
    api.patch<Contrato>(`/contratos/${id}/semaforo`, { semaforo }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/contratos/${id}`),

  // Hitos
  createHito: (contratoId: string, payload: CreateHitoPayload) =>
    api.post<HitoContrato>(`/contratos/${contratoId}/hitos`, payload).then((r) => r.data),

  updateHito: (contratoId: string, hitoId: string, payload: UpdateHitoPayload) =>
    api.put<HitoContrato>(`/contratos/${contratoId}/hitos/${hitoId}`, payload).then((r) => r.data),

  deleteHito: (contratoId: string, hitoId: string) =>
    api.delete(`/contratos/${contratoId}/hitos/${hitoId}`),
};
