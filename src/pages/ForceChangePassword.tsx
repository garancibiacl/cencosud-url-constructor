import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

export default function ForceChangePassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Contraseña actualizada correctamente");
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
            Tu contraseña es temporal. Debes cambiarla para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-pw" className="text-white/80">Nueva contraseña</Label>
              <Input
                id="new-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border-white/15 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw" className="text-white/80">Confirmar contraseña</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="border-white/15 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-white text-[#0341a5] hover:bg-white/90 font-semibold">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
