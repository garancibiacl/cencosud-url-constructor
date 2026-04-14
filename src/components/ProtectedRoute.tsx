import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, mustChangePassword } = useAuth();

  // While auth is resolving, render nothing (near-instant, no flash)
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/cambio-pass" replace />;

  return <>{children}</>;
}
