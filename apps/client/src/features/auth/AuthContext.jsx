/* eslint-disable react/prop-types */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authApi from './authApi';
import {
  clearStoredTokens,
  readStoredTokens,
  storeTokens,
} from './authStorage';

const AuthContext = createContext(null);

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(() => readStoredTokens());
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((session) => {
    storeTokens(session.tokens);
    setTokens(session.tokens);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredTokens();
    setTokens({ accessToken: null, refreshToken: null });
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedTokens = readStoredTokens();

      if (!storedTokens.accessToken || !storedTokens.refreshToken) {
        if (isMounted) {
          clearSession();
          setIsLoading(false);
        }
        return;
      }

      try {
        const current = await authApi.getCurrentUser(storedTokens.accessToken);
        if (isMounted) {
          setTokens(storedTokens);
          setUser(current.user);
        }
      } catch {
        try {
          const refreshedSession = await authApi.refresh(
            storedTokens.refreshToken
          );
          if (isMounted) {
            persistSession(refreshedSession);
          }
        } catch {
          if (isMounted) {
            clearSession();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession, persistSession]);

  const login = useCallback(
    async (payload) => {
      try {
        const session = await authApi.login(payload);
        persistSession(session);
        return session.user;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to log in'));
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      try {
        const session = await authApi.register(payload);
        persistSession(session);
        return session.user;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to create account'));
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    const refreshToken = tokens.refreshToken;
    clearSession();

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // The local session is cleared even if the network request fails.
      }
    }
  }, [clearSession, tokens.refreshToken]);

  const value = useMemo(
    () => ({
      user,
      tokens,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      register,
    }),
    [isLoading, login, logout, register, tokens, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
