import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  // Add other user fields as needed
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isInitializing: boolean;
  setInitializing: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  isInitializing: true,
  setInitializing: (loading) => set({ isInitializing: loading }),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, isAuthenticated: true, token, isInitializing: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, token: null, isInitializing: false });
  },
}));
