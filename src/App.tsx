import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import LobbyPage from './pages/game/LobbyPage';
import GamePage from './pages/game/GamePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient();

import { useEffect } from 'react';
import { authApi } from './api/authApi';

function App() {
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setInitializing(false);
        return;
      }

      try {
        const user = await authApi.getMe();
        login(user, storedToken);
      } catch (error) {
        console.error('Failed to restore auth:', error);
        logout();
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();
  }, [login, logout, setInitializing]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/:mode" element={<GamePage />} />
          </Route>

          <Route path="/" element={<Navigate to={token ? "/lobby" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
