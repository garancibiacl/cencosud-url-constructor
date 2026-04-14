import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLoadingScreenProps {
  title?: string;
  description?: string;
}

export default function AuthLoadingScreen({
  title = "Cargando tu sesión",
  description = "Estamos validando tu acceso para mostrar la vista correcta.",
}: AuthLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 text-sidebar-foreground">
      <Card className="w-full max-w-md border-white/10 bg-white/10 shadow-elevated backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <Logo />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ShieldCheck className="h-8 w-8 text-sidebar-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="text-sm leading-6 text-white/70">{description}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando acceso
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
