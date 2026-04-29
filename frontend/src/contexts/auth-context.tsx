/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_EMAIL_KEY = 'auth_email';

type AuthContextValue = {
  email: string | null;
  isAuthenticated: boolean;
  login: (nextEmail: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [email, setEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_EMAIL_KEY);
  });

  const login = useCallback((nextEmail: string) => {
    localStorage.setItem(AUTH_EMAIL_KEY, nextEmail);
    setEmail(nextEmail);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_EMAIL_KEY);
    setEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      email,
      isAuthenticated: Boolean(email),
      login,
      logout,
    }),
    [email, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
