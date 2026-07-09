"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  currentUserRequest,
  isUnauthorizedError,
  loginRequest,
  logoutRequest,
  registerRequest,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  clearSession: () => void;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  register: (payload: RegisterRequest) => Promise<void>;
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};

const TOKEN_KEY = "applyai.auth.token";
const USER_KEY = "applyai.auth.user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const storedUser = window.localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const redirectToLogin = useCallback(() => {
    const destination = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?redirect=${encodeURIComponent(destination)}`);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? window.localStorage.getItem(TOKEN_KEY);

    if (!activeToken) {
      clearSession();
      return null;
    }

    try {
      const nextUser = await currentUserRequest(activeToken);
      persistSession(activeToken, nextUser);
      return nextUser;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
        redirectToLogin();
      }

      throw error;
    }
  }, [clearSession, persistSession, redirectToLogin, token]);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) {
        return;
      }

      const storedToken = window.localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setStatus("unauthenticated");
        return;
      }

      setToken(storedToken);
      setUser(readStoredUser());
      setStatus("authenticated");

      currentUserRequest(storedToken)
        .then((nextUser) => {
          if (isActive) {
            persistSession(storedToken, nextUser);
          }
        })
        .catch((error: unknown) => {
          if (isActive && isUnauthorizedError(error)) {
            clearSession();
          }
        });
    });

    return () => {
      isActive = false;
    };
  }, [clearSession, persistSession]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginRequest(payload);
      persistSession(response.token, response.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerRequest(payload);
      persistSession(response.token, response.user);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    const activeToken = token ?? window.localStorage.getItem(TOKEN_KEY);

    try {
      if (activeToken) {
        await logoutRequest(activeToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      clearSession,
      login,
      logout,
      refreshUser,
      register,
      status,
      token,
      user,
    }),
    [clearSession, login, logout, refreshUser, register, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
