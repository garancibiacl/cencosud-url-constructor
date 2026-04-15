import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { appModules, canAccessModule } from "@/modules/appModules";

/**
 * RoleGuard — blocks access to a route if the user's role
 * doesn't have permission for the module at that path.
 * Falls back to the first allowed module's path.
 */
export default function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { role } = useAuth();
  const mod = appModules.find((m) => m.path === path);

  if (mod && !canAccessModule(mod, role)) {
    const firstAllowed = appModules.find((m) => canAccessModule(m, role));
    return <Navigate to={firstAllowed?.path ?? "/login"} replace />;
  }

  return <>{children}</>;
}
