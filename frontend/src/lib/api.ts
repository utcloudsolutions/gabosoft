import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// En producción (Render) se inyecta VITE_API_BASE_URL apuntando al backend.
// En desarrollo el proxy de Vite reenvía /api → http://localhost:4000.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Attach access token ─────────────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Auto-refresh on 401 ─────────────────────────────────────── */
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      tokenStorage.set(data.accessToken, data.refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      queue.forEach((cb) => cb(data.accessToken));
      queue = [];
      return api(original);
    } catch {
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  },
);
