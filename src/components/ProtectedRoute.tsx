import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, mustChangePassword } = useAuth();

  // Solo blanquear en carga inicial (sin usuario conocido).
  // Si el usuario ya está autenticado y loading es por un refresco de perfil, no interrumpir la UI.
  if (loading && !user) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/cambio-pass" replace />;

  return <>{children}</>;
}
