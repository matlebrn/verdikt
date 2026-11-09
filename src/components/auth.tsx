"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = { session: Session | null; loading: boolean; recovery: boolean };

const AuthContext = createContext<AuthState>({ session: null, loading: true, recovery: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, recovery: false });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({ session, loading: false, recovery: s.recovery || event === "PASSWORD_RECOVERY" }));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);

/** En-têtes à joindre aux appels de l'API Verdikt. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}
