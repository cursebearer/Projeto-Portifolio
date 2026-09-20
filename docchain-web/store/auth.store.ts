import { create } from 'zustand';
import api from '@/lib/api';
import type {
  AuthenticatedUser,
  LoginInput,
  RegisterInput,
} from '@/types/user';

interface AuthState {
  user: AuthenticatedUser | null;
  isHydrated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthenticatedUser>;
  register: (input: RegisterInput) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<AuthenticatedUser | null>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,
  isLoading: false,

  login: async (input) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/login', input);
      const { data } = await api.get<AuthenticatedUser>('/auth/me');
      set({ user: data, isHydrated: true, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<AuthenticatedUser>(
        '/auth/register',
        input,
      );
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, isHydrated: true });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get<AuthenticatedUser>('/auth/me');
      set({ user: data, isHydrated: true });
      return data;
    } catch {
      set({ user: null, isHydrated: true });
      return null;
    }
  },

  reset: () => set({ user: null, isHydrated: false, isLoading: false }),
}));
