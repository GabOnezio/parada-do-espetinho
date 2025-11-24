import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, setTokens } from '../api/client';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextProps = {
  user: User | null;
  loading: boolean;
  login: (payload: {
    email: string;
    password: string;
    totp?: string;
    context?: 'ADMIN' | 'VENDAS';
  }) => Promise<{ require2fa?: boolean; userId?: string; otpauthUrl?: string } | void>;
  verify2fa: (userId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

function decodeToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as { sub: string; role: string };
  } catch (err) {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    if (storedAccess && storedRefresh) {
      const decoded = decodeToken(storedAccess);
      if (decoded) {
        setUser({
          id: decoded.sub,
          email: '',
          name: 'Usuário',
          role: decoded.role
        });
      }
    }
    setLoading(false);
  }, []);

  const login: AuthContextProps['login'] = async ({ email, password, totp }) => {
    const response = await api.post('/auth/login', { email, password, totp });
    if (response.data.require2fa) {
      return { require2fa: true, userId: response.data.userId, otpauthUrl: response.data.otpauthUrl };
    }
    const { accessToken, refreshToken, user: userPayload } = response.data;
    setTokens({ accessToken, refreshToken });
    setUser(userPayload);
  };

  const verify2fa: AuthContextProps['verify2fa'] = async (userId, code) => {
    const response = await api.post('/auth/2fa/verify', { userId, code });
    const { accessToken, refreshToken, user: userPayload } = response.data;
    setTokens({ accessToken, refreshToken });
    setUser(userPayload);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    }
    clearTokens();
    setUser(null);
    window.location.assign('/');
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      verify2fa,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
