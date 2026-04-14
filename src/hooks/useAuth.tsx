import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "disenador" | "programador" | "director";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [ready, setReady] = useState(false);
  const processingRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", userId)
      .maybeSingle();
    return {
      role: (data?.role as AppRole) ?? null,
      mustChange: data?.must_change_password ?? false,
    };
  }, []);

  // Apply session + profile atomically: set ALL state before marking ready
  const applySession = useCallback(async (s: Session | null) => {
    if (s?.user) {
      const profile = await fetchProfile(s.user.id);
      // Batch all state updates together so React renders once with complete data
      setSession(s);
      setUser(s.user);
      setRole(profile.role);
      setMustChangePassword(profile.mustChange);
    } else {
      setSession(null);
      setUser(null);
      setRole(null);
      setMustChangePassword(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Restore session from storage — single source of truth for init
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await applySession(s);
      setReady(true);
    });

    // 2. Listen for SUBSEQUENT auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (event === "INITIAL_SESSION") return;

        // Prevent concurrent processing
        if (processingRef.current) return;
        processingRef.current = true;

        // Go back to loading so no protected content flashes
        setReady(false);
        await applySession(s);
        setReady(true);

        processingRef.current = false;
      }
    );

    return () => subscription.unsubscribe();
  }, [applySession]);

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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error && user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      setMustChangePassword(false);
    }
    return { error: error?.message ?? null };
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, role, mustChangePassword, loading: !ready, login, logout, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
