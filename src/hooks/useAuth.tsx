import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  const [initialized, setInitialized] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const mountedRef = useRef(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", userId)
      .maybeSingle();
    if (!mountedRef.current) return;
    setRole((data?.role as AppRole) ?? null);
    setMustChangePassword(data?.must_change_password ?? false);
    setProfileReady(true);
  };

  useEffect(() => {
    mountedRef.current = true;

    // 1. Load initial session + profile BEFORE marking as initialized
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        setProfileReady(true);
      }
      setInitialized(true);
    });

    // 2. Listen for subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mountedRef.current) return;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          // Reset profileReady so downstream sees loading while we fetch
          setProfileReady(false);
          await fetchProfile(s.user.id);
        } else {
          setRole(null);
          setMustChangePassword(false);
          setProfileReady(true);
        }
        setInitialized(true);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // loading = true until BOTH session check AND profile fetch are done
  const loading = !initialized || (!!user && !profileReady);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error && user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      setMustChangePassword(false);
    }
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ session, user, role, mustChangePassword, loading, login, logout, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
