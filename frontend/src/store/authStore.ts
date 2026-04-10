import { create } from 'zustand';
import { api } from '../lib/api';
import { tokenStorage } from '../lib/tokenStorage';

interface AuthUser {
  id: string;
  email: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'COLABORADOR';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    // Intentar refresh silencioso para validar que el token sigue activo
    try {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) throw new Error('no refresh');
      const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
      tokenStorage.set(data.accessToken, data.refreshToken);
      const user = parseJwt(data.accessToken);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStorage.set(data.accessToken, data.refreshToken);
    const user = parseJwt(data.accessToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
