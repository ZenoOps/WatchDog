import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiError,
  type AuthSession,
  type AuthUser,
  getCurrentSession,
  login,
  logout,
  signup,
} from './api';

const SESSION_TOKEN_KEY = 'watchdog.session-token';

type AuthContextValue = {
  initializing: boolean;
  user: AuthUser | null;
  signIn: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
        if (!token) {
          return;
        }

        const current = await getCurrentSession(token);
        if (active) {
          setSession({ token, ...current });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const completeAuthentication = useCallback(async (nextSession: AuthSession, persist: boolean) => {
    if (persist) {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, nextSession.token);
    } else {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    }
    setSession(nextSession);
  }, []);

  const signIn = useCallback(
    async (input: { email: string; password: string; remember: boolean }) => {
      const nextSession = await login(input);
      await completeAuthentication(nextSession, input.remember);
    },
    [completeAuthentication],
  );

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const nextSession = await signup(input);
      await completeAuthentication(nextSession, true);
    },
    [completeAuthentication],
  );

  const signOut = useCallback(async () => {
    const token = session?.token;
    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Local sign-out must still work if the backend is temporarily unreachable.
    } finally {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      setSession(null);
    }
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(
    () => ({ initializing, user: session?.user ?? null, signIn, signUp, signOut }),
    [initializing, session?.user, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
