import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { user, loading, mustChangePassword, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (loading) return null;

  if (user && mustChangePassword) return <Navigate to="/cambio-pass" replace />;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await login(email, password);
    setSubmitting(false);
    if (error) toast.error(error);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Revisa tu correo para restablecer la contraseña");
      setMode("login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 text-sidebar-foreground">
      <Card className="w-full max-w-md border-white/10 bg-white/10 shadow-elevated backdrop-blur-xl">
        <CardHeader className="items-center space-y-4 pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {mode === "login" ? "Iniciar Sesión" : "Recuperar Contraseña"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "login" ? handleLogin : handleForgot} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@admin.cl"
                  className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-white font-semibold text-primary hover:bg-white/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Enviar enlace"}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "forgot" : "login")}
              className="block w-full text-center text-sm text-white/60 transition-colors hover:text-white"
            >
              {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver al inicio de sesión"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
