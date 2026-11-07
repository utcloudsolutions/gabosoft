import { api } from './api';

export type Severidad = 'danger' | 'warning' | 'info';

export interface Notificacion {
  id: string;
  tipo: string;
  severidad: Severidad;
  titulo: string;
  descripcion: string;
  entidad: string;
  enlace: string;
  fecha: string;
}

export const notificacionesApi = {
  list: () => api.get<Notificacion[]>('/notificaciones').then((r) => r.data),
  conteo: () => api.get<{ count: number }>('/notificaciones/conteo').then((r) => r.data.count),
};
