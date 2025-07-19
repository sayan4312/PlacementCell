import { create } from 'zustand';

interface AuthState {
  user: any;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  getUserRole: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  isAuthenticated: () => !!get().token,
  getUserRole: () => get().user?.role || null,
}));

export function initializeAuth() {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (user && token) {
    useAuthStore.getState().setAuth(JSON.parse(user), token);
  }
}

// Standalone helpers for legacy pattern
export function getAuthToken() {
  return localStorage.getItem('token');
}
export function isAuthenticated() {
  return !!getAuthToken();
}
export function getUserRole() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).role : null;
}
export function logoutAndRedirect() {
  useAuthStore.getState().logout();
  window.location.href = '/login';
} 