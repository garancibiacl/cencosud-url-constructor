import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, KeyRound, Shield, Users } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  role: string;
  must_change_password: boolean;
  created_at: string;
};

const ROLES = ["admin", "disenador", "programador", "director"] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  disenador: "Diseñador",
  programador: "Programador",
  director: "Director",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/15 text-red-600 border-red-500/30",
  disenador: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  programador: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  director: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export default function AdminPage() {
  const { role, user, loading: authLoading } = useAuth();
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
    if (role === "admin") fetchUsers();
  }, [role]);

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId + "_role");
    const { data, error } = await supabase.functions.invoke("admin-manage", {
      body: { userId, action: "update_role", role: newRole },
    });
    setActionLoading(null);
    if (error || data?.error) {
      toast.error(data?.error ?? "Error al cambiar rol");
    } else {
      toast.success("Rol actualizado");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    setActionLoading(userId + "_pw");
    const { data, error } = await supabase.functions.invoke("admin-manage", {
      body: { userId, action: "reset_password" },
    });
    setActionLoading(null);
    if (error || data?.error) {
      toast.error(data?.error ?? "Error al resetear contraseña");
    } else {
      toast.success(`Contraseña de ${email} reseteada a Agua2026!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, must_change_password: true } : u))
      );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Administración</h1>
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
                  {users.map((u) => {
                    const isMe = u.id === user?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.email}
                          {isMe && (
                            <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isMe ? (
                            <Badge variant="outline" className={ROLE_COLORS[u.role]}>
                              {ROLE_LABELS[u.role]}
                            </Badge>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(val) => handleRoleChange(u.id, val)}
                              disabled={actionLoading === u.id + "_role"}
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
                          {u.must_change_password ? (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                              Cambio pendiente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                              Activo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString("es-CL")}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isMe && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === u.id + "_pw"}
                              onClick={() => handleResetPassword(u.id, u.email)}
                            >
                              {actionLoading === u.id + "_pw" ? (
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
