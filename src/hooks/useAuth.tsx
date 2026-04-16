import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "disenador" | "programador" | "director" | "cencosud" | "mailing";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  mustChangePassword: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (data: { first_name?: string; last_name?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const mountedRef = useRef(true);
  const syncVersionRef = useRef(0);

  const resetProfileState = useCallback(() => {
    setRole(null);
    setMustChangePassword(false);
  }, []);

  const syncProfile = useCallback(async (nextSession: Session | null) => {
    const syncVersion = ++syncVersionRef.current;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      resetProfileState();
      if (mountedRef.current && syncVersion === syncVersionRef.current) {
        setProfileReady(true);
      }
      return;
    }

    setProfileReady(false);

    const { data } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", nextSession.user.id)
      .maybeSingle();

    if (!mountedRef.current || syncVersion !== syncVersionRef.current) return;

    setRole((data?.role as AppRole) ?? null);
    setMustChangePassword(data?.must_change_password ?? false);
    setProfileReady(true);
  }, [resetProfileState]);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;
      await syncProfile(initialSession);
      if (!mountedRef.current) return;
      setAuthReady(true);
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") return;
      if (!mountedRef.current) return;

      // USER_UPDATED solo actualiza metadatos del usuario (ej: nombre/apellido).
      // No es necesario re-fetchar el profile de Supabase — evita el flash de pantalla blanca.
      if (event === "USER_UPDATED") {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        return;
      }

      setAuthReady(true);
      void syncProfile(nextSession);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const loading = !authReady || !profileReady;

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const currentUser = user;
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (!error && currentUser) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", currentUser.id);
      setMustChangePassword(false);
    }

    return { error: error?.message ?? null };
  }, [user]);

  const updateProfile = useCallback(async (data: { first_name?: string; last_name?: string }) => {
    const { error } = await supabase.auth.updateUser({ data });
    if (!error) {
      const { data: { user: refreshed } } = await supabase.auth.getUser();
      if (mountedRef.current && refreshed) setUser(refreshed);
    }
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    session,
    user,
    role,
    mustChangePassword,
    loading,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
  }), [session, user, role, mustChangePassword, loading, login, logout, resetPassword, updatePassword, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
