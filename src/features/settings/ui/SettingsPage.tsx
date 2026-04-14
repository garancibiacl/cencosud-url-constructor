import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User, Lock, Mail, Loader2, Eye, EyeOff,
  CheckCircle2, ShieldCheck, Sparkles, KeyRound,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────── */
function getInitials(firstName: string, lastName: string, email: string) {
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

function getDisplayName(firstName: string, lastName: string, email: string) {
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  return email.split("@")[0];
}

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  disenador: "Diseñador",
  programador: "Programador",
  director: "Director",
};

/* ─── animation presets ───────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

/* ─── component ───────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, role, updateProfile, resetPassword, updatePassword } = useAuth();

  const meta = user?.user_metadata ?? {};
  const [firstName, setFirstName] = useState<string>(meta.first_name ?? "");
  const [lastName, setLastName]   = useState<string>(meta.last_name  ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const profileChanged =
    firstName.trim() !== (meta.first_name ?? "") ||
    lastName.trim()  !== (meta.last_name  ?? "");

  const initials    = getInitials(firstName, lastName, user?.email ?? "");
  const displayName = getDisplayName(firstName, lastName, user?.email ?? "");

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() });
    setSavingProfile(false);
    if (error) toast.error(error);
    else toast.success("Perfil actualizado");
  };

  /* contraseña */
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [savingPassword,  setSavingPassword]  = useState(false);

  const passwordMatch = newPassword.length >= 8 && newPassword === confirmPassword;
  const passwordError = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) return;
    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setSavingPassword(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword(""); setConfirmPassword("");
    }
  };

  /* reset email */
  const [sendingReset, setSendingReset] = useState(false);
  const handleSendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await resetPassword(user.email);
    setSendingReset(false);
    if (error) toast.error(error);
    else toast.success("Enlace enviado a tu correo");
  };

  /* ── render ── */
  return (
    <div
      className="min-h-full w-full"
      style={{
        background: "linear-gradient(145deg, #f0f5ff 0%, #e8f0fe 40%, #f5f8ff 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">

        {/* ══ HERO HEADER ══════════════════════════════════════ */}
        <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #0341a5 0%, #0256c4 45%, #1e90ff 100%)",
            boxShadow: "0 8px 32px rgba(3,65,165,0.35), 0 2px 8px rgba(3,65,165,0.2)",
          }}
        >
          {/* Blobs decorativos */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-[#1e90ff]/20 blur-2xl" />

          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 shadow-md">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
                {role && (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm border border-white/20">
                    {roleLabel[role] ?? role}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-white/60 truncate">{user?.email}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                <Sparkles className="h-3 w-3" />
                Tu espacio personal en la plataforma Cencosud
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══ PERFIL ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.08)}>
          <SectionCard
            icon={<User className="h-5 w-5" />}
            title="Información personal"
            subtitle="Personaliza cómo te ven los demás en la plataforma"
          >
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="h-11 cursor-not-allowed bg-muted/40 pl-10 text-sm opacity-70"
                  />
                </div>
                <p className="text-xs text-muted-foreground/70">El correo está vinculado a tu cuenta y no puede modificarse.</p>
              </div>

              {/* Nombre / Apellido */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldBox label="Nombre" id="first_name">
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tu nombre"
                    className="h-11 text-sm focus-visible:ring-[#0341a5]/50"
                  />
                </FieldBox>
                <FieldBox label="Apellido" id="last_name">
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tu apellido"
                    className="h-11 text-sm focus-visible:ring-[#0341a5]/50"
                  />
                </FieldBox>
              </div>

              <div className="flex justify-end">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!profileChanged || savingProfile}
                    className="h-11 gap-2 px-6 text-sm font-semibold text-white disabled:opacity-40"
                    style={{
                      background: profileChanged
                        ? "linear-gradient(135deg, #0341a5 0%, #0568d6 100%)"
                        : undefined,
                      boxShadow: profileChanged
                        ? "0 4px 16px rgba(3,65,165,0.35)"
                        : undefined,
                    }}
                  >
                    {savingProfile
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />
                    }
                    Guardar cambios
                  </Button>
                </motion.div>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* ══ SEGURIDAD ═════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.16)}>
          <SectionCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Seguridad"
            subtitle="Mantén tu cuenta protegida con una contraseña segura"
          >
            <form onSubmit={handleChangePassword} className="space-y-5">
              <FieldBox label="Nueva contraseña" id="new_password">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="new_password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="h-11 pl-10 pr-10 text-sm focus-visible:ring-[#0341a5]/50"
                  />
                  <ToggleVisibility show={showNew} onToggle={() => setShowNew(!showNew)} />
                </div>
              </FieldBox>

              <FieldBox label="Confirmar contraseña" id="confirm_password">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`h-11 pl-10 pr-10 text-sm transition-colors focus-visible:ring-[#0341a5]/50 ${
                      passwordError ? "border-red-400 focus-visible:ring-red-300" : ""
                    } ${passwordMatch ? "border-green-400 focus-visible:ring-green-300" : ""}`}
                  />
                  <ToggleVisibility show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>
                {passwordError && (
                  <motion.p {...fadeUp(0)} className="text-xs text-red-500">Las contraseñas no coinciden</motion.p>
                )}
                {passwordMatch && (
                  <motion.p {...fadeUp(0)} className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Las contraseñas coinciden
                  </motion.p>
                )}
              </FieldBox>

              <div className="flex justify-end">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    disabled={!passwordMatch || savingPassword}
                    className="h-11 gap-2 px-6 text-sm font-semibold text-white disabled:opacity-40"
                    style={{
                      background: passwordMatch
                        ? "linear-gradient(135deg, #0341a5 0%, #0568d6 100%)"
                        : undefined,
                      boxShadow: passwordMatch
                        ? "0 4px 16px rgba(3,65,165,0.35)"
                        : undefined,
                    }}
                  >
                    {savingPassword
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Lock className="h-4 w-4" />
                    }
                    Actualizar contraseña
                  </Button>
                </motion.div>
              </div>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground/50 font-medium">o</span>
              <Separator className="flex-1" />
            </div>

            {/* Reset por correo */}
            <div
              className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: "linear-gradient(135deg, #f0f5ff, #e8f0fe)",
                border: "1px solid rgba(3,65,165,0.12)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "linear-gradient(135deg, #0341a5, #0568d6)", boxShadow: "0 2px 8px rgba(3,65,165,0.3)" }}
                >
                  <KeyRound className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Restablecer por correo</p>
                  <p className="text-xs text-muted-foreground">
                    Enviaremos un enlace seguro a{" "}
                    <span className="font-medium text-[#0341a5]">{user?.email}</span>
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                <Button
                  variant="outline"
                  onClick={handleSendReset}
                  disabled={sendingReset}
                  className="h-10 gap-2 border-[#0341a5]/30 text-[#0341a5] text-sm font-semibold hover:bg-[#0341a5] hover:text-white transition-colors"
                >
                  {sendingReset
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Mail className="h-4 w-4" />
                  }
                  Enviar enlace
                </Button>
              </motion.div>
            </div>
          </SectionCard>
        </motion.div>

      </div>
    </div>
  );
}

/* ─── sub-componentes locales ─────────────────────────────── */

function SectionCard({
  icon, title, subtitle, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 2px 16px rgba(3,65,165,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header de la card con franja azul */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{
          background: "linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)",
          borderBottom: "1px solid rgba(3,65,165,0.08)",
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, #0341a5 0%, #0568d6 100%)",
            boxShadow: "0 3px 10px rgba(3,65,165,0.35)",
          }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Acento azul izquierdo */}
      <div className="relative">
        <div
          className="absolute left-0 top-0 h-full w-0.5"
          style={{ background: "linear-gradient(180deg, #0341a5, #1e90ff)" }}
        />
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FieldBox({
  label, id, children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleVisibility({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-foreground"
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
