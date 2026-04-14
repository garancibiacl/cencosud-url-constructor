import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Eye, EyeOff, Check, X } from "lucide-react";

const MIN_LENGTH = 6;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <X className="h-3.5 w-3.5 text-white/30" />
      )}
      <span className={met ? "text-emerald-300" : "text-white/40"}>{label}</span>
    </div>
  );
}

export default function ForceChangePassword() {
  const { updatePassword, user, loading, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = password.length >= MIN_LENGTH;
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = hasMinLength && passwordsMatch && !submitting;

  // Guard: if not logged in or doesn't need to change password, redirect
  if (!loading && (!user || !mustChangePassword)) {
    navigate(user ? "/constructor-url" : "/login", { replace: true });
    return null;
  }

  if (loading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Contraseña actualizada correctamente");
      navigate("/constructor-url", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0341a5] to-[#022b6e] px-4">
      <Card className="w-full max-w-md border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <CardHeader className="items-center space-y-3 pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
            <ShieldAlert className="h-7 w-7 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Cambio obligatorio</CardTitle>
          <CardDescription className="text-center text-white/60">
            Tu contraseña es temporal. Crea una nueva contraseña de al menos {MIN_LENGTH} caracteres para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-pw" className="text-white/80">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  maxLength={64}
                  placeholder="••••••"
                  className="border-white/15 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pw" className="text-white/80">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  maxLength={64}
                  placeholder="••••••"
                  className="border-white/15 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg bg-white/5 p-3">
              <PasswordRule met={hasMinLength} label={`Mínimo ${MIN_LENGTH} caracteres`} />
              <PasswordRule met={passwordsMatch} label="Las contraseñas coinciden" />
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-white text-[#0341a5] hover:bg-white/90 font-semibold disabled:opacity-40"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
