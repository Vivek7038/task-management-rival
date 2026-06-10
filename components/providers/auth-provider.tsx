"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setState({ status: "authenticated", user: data.user });
        } else {
          setState({ status: "unauthenticated" });
        }
      })
      .catch(() => setState({ status: "unauthenticated" }));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ status: "unauthenticated" });
    window.location.href = "/login";
  }, []);

  const setUser = useCallback((user: AuthUser | null) => {
    setState(user ? { status: "authenticated", user } : { status: "unauthenticated" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.status === "authenticated" ? state.user : null,
        isLoading: state.status === "loading",
        isAuthenticated: state.status === "authenticated",
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
