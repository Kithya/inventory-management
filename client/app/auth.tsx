"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setAuthTokenGetter } from "@/state/authToken";
import { LoadingState } from "./(components)/ui";

type AuthRole = "ADMIN" | "USER";
type AuthStatus = "ACTIVE" | "DISABLED";

type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: AuthRole;
  status: AuthStatus;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type InventoryAuthState = {
  isAuthConfigured: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  userName: string;
  user: AuthUser | null;
  login: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  acceptInvite: (input: {
    token: string;
    name: string;
    password: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetLink?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const publicPaths = ["/login", "/accept-invite", "/forgot-password", "/reset-password"];

async function parseAuthResponse(response: Response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body?.error?.message === "string"
        ? body.error.message
        : "Authentication request failed.";
    throw new Error(message);
  }

  return body;
}

async function authRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  return parseAuthResponse(response) as Promise<T>;
}

const InventoryAuthContext = createContext<InventoryAuthState | null>(null);

export function InventoryAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(accessToken ? async () => accessToken : null);
    return () => setAuthTokenGetter(null);
  }, [accessToken]);

  const applySession = useCallback((session: AuthResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const session = await authRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
    });
    applySession(session);
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;
    const timer = window.setTimeout(() => {
      refreshSession()
        .catch(() => {
          if (isMounted) clearSession();
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [clearSession, refreshSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      applySession(session);
      router.push("/dashboard");
    },
    [applySession, router],
  );

  const acceptInvite = useCallback(
    async (input: { token: string; name: string; password: string }) => {
      const session = await authRequest<AuthResponse>("/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify(input),
      });
      applySession(session);
      router.push("/dashboard");
    },
    [applySession, router],
  );

  const forgotPassword = useCallback(async (email: string) => {
    return authRequest<{ ok: boolean; resetLink?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await authRequest<{ ok: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/login");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authRequest<{ ok: boolean }>("/auth/logout", { method: "POST" }).catch(
      () => undefined,
    );
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  const login = useCallback(() => {
    router.push("/login");
  }, [router]);

  const value = useMemo<InventoryAuthState>(
    () => ({
      isAuthConfigured: true,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "ADMIN",
      isLoading,
      userName: user?.name ?? "Account",
      user,
      login,
      signIn,
      acceptInvite,
      forgotPassword,
      resetPassword,
      logout,
      refreshSession,
    }),
    [
      accessToken,
      acceptInvite,
      forgotPassword,
      isLoading,
      login,
      logout,
      refreshSession,
      resetPassword,
      signIn,
      user,
    ],
  );

  if (isLoading) {
    return <LoadingState label="Checking your session" />;
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!value.isAuthenticated && !isPublicPath) {
    return (
      <InventoryAuthContext.Provider value={value}>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
          <div className="surface w-full max-w-sm p-6 text-center">
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">
              Inventory
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue to the inventory workspace.
            </p>
            <Link className="button-primary mt-5 w-full" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </InventoryAuthContext.Provider>
    );
  }

  return (
    <InventoryAuthContext.Provider value={value}>
      {children}
    </InventoryAuthContext.Provider>
  );
}

export function useInventoryAuth() {
  const context = useContext(InventoryAuthContext);
  if (!context) {
    throw new Error("useInventoryAuth must be used inside InventoryAuthProvider");
  }
  return context;
}
