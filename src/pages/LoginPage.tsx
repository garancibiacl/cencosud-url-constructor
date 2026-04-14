import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Mail, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import loginHero from "@/assets/login-hero.jpg";

export default function LoginPage() {
  const { user, loading, mustChangePassword, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (loading) return null;
  if (user && mustChangePassword) return <Navigate to="/cambio-pass" replace />;
  if (user) return <Navigate to="/" replace />;

  const canSubmit = mode === "forgot" ? email.length > 0 : email.length > 0 && password.length > 0;

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
    <div className="flex min-h-screen w-full">
      {/* Left — Branding Panel */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[hsl(210,100%,22%)] via-[hsl(210,100%,32%)] to-[hsl(193,100%,40%)] p-10 lg:flex">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[hsl(193,100%,66%)]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-1/4 h-40 w-40 rotate-45 rounded-3xl border border-white/10" />

        {/* Top — Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img src="/logo.png" alt="SECOSUR" className="h-12 w-auto" />
        </motion.div>

        {/* Center — Hero */}
        <motion.div
          className="flex flex-1 flex-col items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img
            src={loginHero}
            alt="Soluciones digitales"
            className="w-full max-w-md drop-shadow-2xl"
            width={960}
            height={1080}
          />
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Soluciones digitales para{" "}
              <span className="text-[hsl(193,100%,66%)]">SECOSUR</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/70">
              Accede a tu plataforma y gestiona todo en un solo lugar
            </p>
          </div>
        </motion.div>

        {/* Bottom — Features */}
        <motion.div
          className="flex gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {[
            { icon: Shield, text: "Seguro" },
            { icon: Zap, text: "Rápido" },
            { icon: BarChart3, text: "Inteligente" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-white/60">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <Icon className="h-3.5 w-3.5 text-[hsl(193,100%,66%)]" />
              </div>
              {text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-10 lg:w-[45%]">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <img src="/logo.png" alt="SECOSUR" className="h-10 w-auto" />
        </div>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Iniciar sesión" : "Recuperar contraseña"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "login"
                ? "Ingresa tus credenciales para acceder a la plataforma"
                : "Te enviaremos un enlace para restablecer tu contraseña"}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={mode === "login" ? handleLogin : handleForgot}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-11 pl-10 text-sm"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Contraseña
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 pl-10 text-sm"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              className="h-11 w-full gap-2 text-sm font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Ingresar" : "Enviar enlace"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "forgot" : "login")}
              className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver al inicio de sesión"}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} SECOSUR — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
