// src/auth/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { msalInstance, loginRequest } from "./msal";

type User = { name?: string; email?: string; oid?: string } | null;

type Ctx = {
  user: User;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
};
const AuthCtx = createContext<Ctx>({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE!;

  useEffect(() => {
    (async () => {
      try {
        const result = await msalInstance.handleRedirectPromise();
        const account = result?.account || msalInstance.getAllAccounts()[0];

        if (account) {
          msalInstance.setActiveAccount(account);

          // Prefer ID token from redirect, else get silently
          const idToken =
            (result as any)?.idToken ||
            (
              await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account,
              })
            ).idToken;

          // Exchange with backend -> sets HttpOnly cookie
          await fetch(`${apiBase}/api/auth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id_token: idToken }),
          });

          // Fetch current user
          const me = await fetch(`${apiBase}/api/auth/me`, {
            credentials: "include",
          });
          if (me.ok) {
            const data = await me.json();
            setUser({
              name: data.name ?? account.name ?? account.username,
              email: data.email ?? account.username,
              oid: data.oid ?? account.localAccountId,
            });
          }
        }
      } catch (e) {
        console.error("Auth bootstrap failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase]);

  const signIn = () => msalInstance.loginRedirect({ ...loginRequest });
  const signOut = () =>
    msalInstance.logoutRedirect({ postLogoutRedirectUri: "/" });

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}
