import { api } from './api';

export interface DashboardKpis {
  procesos: {
    total: number;
    porEstado: {
      ESTRUCTURACION: number;
      PRESENTACION: number;
      GANADO: number;
      NO_ADJUDICADO: number;
      DESIERTO: number;
    };
    proximos30dias: number;
    valorPipeline: number;
  };
  contratos: {
    total: number;
    valorTotal: number;
    valorEjecutado: number;
    avanceFinanciero: number;
    semaforos: {
      VERDE: number;
      AMARILLO: number;
      ROJO: number;
    };
  };
}

export const dashboardApi = {
  kpis: () => api.get<DashboardKpis>('/dashboard/kpis').then((r) => r.data),
};
