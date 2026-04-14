import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ForceChangePassword from "@/pages/ForceChangePassword";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, mustChangePassword } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <ForceChangePassword />;
  return <>{children}</>;
}
