import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { appModules } from "@/modules/appModules";

const ADMIN_SUB_LABELS: Record<string, string> = {
  "/admin/usuarios": "Administración · Usuarios",
  "/admin/accesos": "Administración · Accesos",
  "/admin/archivos": "Administración · Archivos",
};

function resolveModule(pathname: string): { label: string; path: string } | null {
  if (ADMIN_SUB_LABELS[pathname]) {
    return { label: ADMIN_SUB_LABELS[pathname], path: pathname };
  }
  const mod = appModules.find((m) => m.path === pathname);
  if (mod) return { label: mod.label, path: mod.path };
  const parent = appModules.find((m) => m.path !== "/" && pathname.startsWith(m.path + "/"));
  if (parent) return { label: parent.label, path: pathname };
  return null;
}

export function useAccessLogger() {
  const { user } = useAuth();
  const location = useLocation();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (location.pathname === lastLoggedPath.current) return;

    const resolved = resolveModule(location.pathname);
    if (!resolved) return;

    lastLoggedPath.current = location.pathname;

    supabase.from("access_logs").insert({
      user_id: user.id,
      email: user.email ?? "",
      event_type: "module_visit",
      module_path: resolved.path,
      module_label: resolved.label,
    }).then(({ error }) => {
      if (error) console.error("[access-log] insert error:", error.message, error);
    });
  }, [location.pathname, user]);
}
