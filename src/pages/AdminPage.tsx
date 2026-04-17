import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, FolderOpen, Loader2, Settings, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  iconColor: string;
  iconBg: string;
  badge?: string;
};

const CARDS: AdminCard[] = [
  {
    id: "usuarios",
    title: "Usuarios",
    description: "Gestiona usuarios, roles y contraseñas del sistema",
    icon: Users,
    path: "/admin/usuarios",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "accesos",
    title: "Registro de Accesos",
    description: "Auditoría de inicios de sesión y actividad de usuarios",
    icon: Activity,
    path: "/admin/accesos",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    badge: "Próximamente",
  },
  {
    id: "archivos",
    title: "Banco de Archivos",
    description: "Administra los archivos compartidos del sistema",
    icon: FolderOpen,
    path: "/admin/archivos",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-500/10",
  },
  {
    id: "config",
    title: "Configuración",
    description: "Ajustes generales y preferencias del sistema",
    icon: Settings,
    path: "/configuracion",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-500/10",
  },
];

export default function AdminPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    if (role === "admin") {
      supabase.functions.invoke("admin-users").then(({ data }) => {
        if (data?.total != null) setUserCount(data.total as number);
        else if (Array.isArray(data?.users)) setUserCount((data.users as unknown[]).length);
      });
    }
  }, [role]);

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="flex-1 space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Administración</h1>
          <p className="text-sm text-muted-foreground">Gestiona todos los aspectos del sistema desde aquí</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.iconBg)}>
                    <Icon className={cn("h-5 w-5", card.iconColor)} />
                  </div>
                  {card.badge && (
                    <Badge variant="outline" className="text-xs">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-3 text-base">{card.title}</CardTitle>
                <CardDescription className="text-sm leading-snug">{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  {card.id === "usuarios" ? (
                    userCount === null ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold">{userCount}</span>
                        <span className="text-xs text-muted-foreground">registrados</span>
                      </div>
                    )
                  ) : (
                    <span />
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
