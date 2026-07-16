import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, tokenStore, type AuthState } from '@/api';
import type { AuthUser } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isBarber: boolean;
  setAuth: (state: AuthState) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(() => tokenStore.get());

  useEffect(() => tokenStore.subscribe(setState), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state?.user ?? null,
      isAuthenticated: Boolean(state),
      isCustomer: state?.user.role === 'customer',
      isBarber: state?.user.role === 'barber',
      setAuth: (next) => tokenStore.set(next),
      logout: async () => {
        // Blacklist the refresh token server-side (best-effort), then drop the
        // local session regardless of whether the request succeeded. Awaiting
        // lets the client refresh an expired access token and retry before we
        // clear, so an idle user's token still gets blacklisted.
        const refresh = tokenStore.getRefresh();
        try {
          if (refresh) await authApi.logout(refresh);
        } catch {
          // ignore — clearing the local session below is what matters
        } finally {
          tokenStore.clear();
        }
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
