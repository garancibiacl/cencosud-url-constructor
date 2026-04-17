import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, FolderOpen, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminArchivosPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="flex-1 space-y-6 p-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Administración
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Banco de Archivos</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
          <FolderOpen className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banco de Archivos</h1>
          <p className="text-sm text-muted-foreground">Administra los archivos compartidos del sistema</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
            <FolderOpen className="h-8 w-8 text-orange-600" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-base">Banco de Archivos del Sistema</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Accede al módulo completo para gestionar archivos, compartir recursos y administrar el almacenamiento.
            </p>
          </div>
          <Button onClick={() => navigate("/banco-archivos")} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Ir al Banco de Archivos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
