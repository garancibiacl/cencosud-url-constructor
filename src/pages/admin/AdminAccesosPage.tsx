import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  LogIn,
  Monitor,
  RefreshCw,
  Loader2,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type AccessLog = {
  id: string;
  user_id: string | null;
  email: string;
  event_type: string;
  module_path: string | null;
  module_label: string | null;
  created_at: string;
};

type FilterType = "all" | "login" | "module_visit";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAccesosPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-access-logs");

    if (error || data?.error) {
      console.error("[admin-access-logs]", error ?? data?.error);
      toast.error(data?.error ?? "Error al cargar el registro de accesos");
    } else {
      setLogs((data?.logs as AccessLog[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (role === "admin") void fetchLogs();
  }, [role]);

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;

  const uniqueEmails = Array.from(new Set(logs.map((l) => l.email))).sort();

  const filtered = logs.filter((l) => {
    const matchType = filter === "all" || l.event_type === filter;
    const matchEmail = emailFilter === "all" || l.email === emailFilter;
    return matchType && matchEmail;
  });

  const loginCount = logs.filter((l) => l.event_type === "login").length;
  const visitCount = logs.filter((l) => l.event_type === "module_visit").length;
  const activeUsers = new Set(logs.map((l) => l.email)).size;

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
        <span className="text-foreground font-medium">Registro de Accesos</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registro de Accesos</h1>
            <p className="text-sm text-muted-foreground">Auditoría de inicios de sesión y navegación</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LogIn className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loginCount}</p>
              <p className="text-xs text-muted-foreground">Inicios de sesión</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{visitCount}</p>
              <p className="text-xs text-muted-foreground">Visitas a módulos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">Usuarios únicos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-4">
          <CardTitle className="text-lg">
            Eventos ({filtered.length}{filtered.length < logs.length ? ` de ${logs.length}` : ""})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={emailFilter} onValueChange={setEmailFilter}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Todos los usuarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {uniqueEmails.map((email) => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="login">Inicios de sesión</SelectItem>
                <SelectItem value="module_visit">Visitas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Monitor className="h-8 w-8" />
              <p className="text-sm">Sin registros para los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.email}</TableCell>
                      <TableCell>
                        {log.event_type === "login" ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary gap-1">
                            <LogIn className="h-3 w-3" />
                            Inicio de sesión
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1">
                            <Monitor className="h-3 w-3" />
                            Visita
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.module_label ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {formatDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
