import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, KeyRound, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Profile = {
  id: string;
  email: string;
  role: string;
  must_change_password: boolean;
  created_at: string;
};

const ROLES = ["admin", "disenador", "programador", "director", "cencosud", "mailing"] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  disenador: "Diseñador",
  programador: "Programador",
  director: "Director",
  cencosud: "Cencosud",
  mailing: "Mailing",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "border-destructive/30 bg-destructive/10 text-destructive",
  disenador: "border-primary/30 bg-primary/10 text-primary",
  programador: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  director: "border-warning/30 bg-warning/10 text-warning-foreground",
  cencosud: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  mailing: "border-violet-500/30 bg-violet-500/10 text-violet-600",
};

export default function AdminUsuariosPage() {
  const { role, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase.functions.invoke("admin-users");
    if (error) {
      toast.error("Error al cargar usuarios");
      return;
    }
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (role === "admin") void fetchUsers();
  }, [role]);

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(`${userId}_role`);
    const { data, error } = await supabase.functions.invoke("admin-manage", {
      body: { userId, action: "update_role", role: newRole },
    });
    setActionLoading(null);
    if (error || data?.error) {
      toast.error(data?.error ?? "Error al cambiar rol");
      return;
    }
    toast.success("Rol actualizado");
    setUsers((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
  };

  const handleResetPassword = async (userId: string, email: string) => {
    setActionLoading(`${userId}_pw`);
    const { data, error } = await supabase.functions.invoke("admin-manage", {
      body: { userId, action: "reset_password" },
    });
    setActionLoading(null);
    if (error || data?.error) {
      toast.error(data?.error ?? "Error al resetear contraseña");
      return;
    }
    toast.success(`Contraseña de ${email} reseteada a Agua2026!`);
    setUsers((prev) => prev.map((p) => (p.id === userId ? { ...p, must_change_password: true } : p)));
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Administración
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Usuarios</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona usuarios, roles y contraseñas</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Usuarios registrados ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((profile) => {
                    const isMe = profile.id === user?.id;
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.email}
                          {isMe && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
                        </TableCell>
                        <TableCell>
                          {isMe ? (
                            <Badge variant="outline" className={ROLE_COLORS[profile.role]}>
                              {ROLE_LABELS[profile.role]}
                            </Badge>
                          ) : (
                            <Select
                              value={profile.role}
                              onValueChange={(value) => handleRoleChange(profile.id, value)}
                              disabled={actionLoading === `${profile.id}_role`}
                            >
                              <SelectTrigger className="h-8 w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {profile.must_change_password ? (
                            <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning-foreground">
                              Cambio pendiente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                              Activo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString("es-CL")}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isMe && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === `${profile.id}_pw`}
                              onClick={() => handleResetPassword(profile.id, profile.email)}
                            >
                              {actionLoading === `${profile.id}_pw` ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Reset Password
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
