import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Lock, Mail, ArrowRight, X, Eye, EyeOff,
  Link2, Image, Wand2, BarChart3, Code2, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Link2, title: "Constructor de URLs", desc: "Genera URLs promocionales en segundos" },
  { icon: Image, title: "Optimizador de Imágenes", desc: "Adapta banners a cada formato y peso" },
  { icon: Wand2, title: "Relleno Generativo IA", desc: "Expande banners con inteligencia artificial" },
  { icon: Sparkles, title: "Biblioteca de Prompts", desc: "Prompts listos para campañas digitales" },
  { icon: Code2, title: "Scripts Illustrator", desc: "Automatiza tareas en Adobe Illustrator" },
  { icon: BarChart3, title: "Historial de Campañas", desc: "Registro y trazabilidad de cada acción" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function LoginPage() {
  const { user, loading, mustChangePassword, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      {/* ─── Left — Branding Panel ─── */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-10 lg:flex">
        {/* Solid brand color behind logo */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0341a5 0%, #0341a5 18%, #0256c4 40%, #0568d6 65%, #1e90ff 100%)" }} />
        {/* Animated decorative shapes */}
        <motion.div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-10 -right-10 h-[28rem] w-[28rem] rounded-full bg-[#1e90ff]/10 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="pointer-events-none absolute right-1/4 top-1/3 h-44 w-44 rotate-45 rounded-3xl border border-white/[0.07]"
          animate={{ rotate: [45, 55, 45], opacity: [0.07, 0.12, 0.07] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/3 bottom-1/4 h-24 w-24 rounded-full border border-white/[0.06]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Top — Logo */}
        <div className="relative z-10 flex w-full justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <img src="/logo.png" alt="Cencosud" className="h-12 w-auto" />
          </motion.div>
        </div>

        {/* Center — Headline + Feature Grid */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10">
          <div className="max-w-lg text-center animate-fade-in">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Soluciones digitales para{" "}
              <motion.span
                className="inline-block bg-gradient-to-r from-[#4fc3f7] to-[#81d4fa] bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Cencosud
              </motion.span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/60">
              Accede a tu plataforma y gestiona todo en un solo lugar
            </p>
          </div>

          {/* Feature cards grid */}
          <motion.div
            className="grid w-full max-w-lg grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -2 }}
                className="group flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.06] p-3.5 backdrop-blur-sm transition-colors hover:border-white/15 hover:bg-white/[0.1]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-white/15">
                  <Icon className="h-4.5 w-4.5 text-[#4fc3f7]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/50">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom — Tagline */}
        <motion.p
          className="relative z-10 text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Automatiza · Optimiza · Acelera — by Agencia Agua
        </motion.p>
      </div>

      {/* ─── Right — Form Panel ─── */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-10 lg:w-[45%]">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <img src="/logo.png" alt="aguApp" className="h-10 w-auto" />
        </div>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
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

          <form onSubmit={mode === "login" ? handleLogin : handleForgot} className="space-y-5">
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
                  className="h-11 pl-10 pr-10 text-sm"
                />
                {email.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEmail("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                    aria-label="Limpiar correo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {mode === "login" && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ y: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="h-12 w-full gap-2 text-sm font-semibold bg-[#0641A5] hover:bg-[#053487] text-white rounded-xl shadow-[0_4px_14px_0_rgba(6,65,165,0.4)] hover:shadow-[0_6px_20px_0_rgba(6,65,165,0.55)] transition-shadow duration-300"
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
            </motion.div>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "forgot" : "login")}
              className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver al inicio de sesión"}
            </button>
          </form>
        </motion.div>

        <p className="mt-12 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} aguApp — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
