import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, PanelLeftClose, PanelLeftOpen, LogOut, Settings, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { appModules } from "@/modules/appModules";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

const SidebarTooltip = ({
  isOpen,
  label,
  children,
}: {
  isOpen: boolean;
  label: string;
  children: React.ReactNode;
}) => {
  if (isOpen) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="border border-white/15 bg-slate-950/95 px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-black/40 backdrop-blur-sm"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

const DarkModeToggle = ({ isOpen }: { isOpen: boolean }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);

  /* Collapsed: icon only with tooltip */
  if (!isOpen) {
    return (
      <SidebarTooltip isOpen={false} label={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}>
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="flex w-full items-center justify-center rounded-lg bg-white/10 py-2.5 text-white/70 transition-all duration-300 hover:bg-white/15 hover:text-white"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>
      </SidebarTooltip>
    );
  }

  /* Expanded: row with label + modern toggle */
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-white/10"
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : -30 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Sun size={18} className="text-orange-400" />
        ) : (
          <Moon size={18} className="text-sky-300" />
        )}
      </motion.div>

      <span className="flex-1 whitespace-nowrap text-left text-sm font-medium text-white/75 group-hover:text-white">
        {isDark ? "Modo claro" : "Modo oscuro"}
      </span>

      {/* Modern toggle switch */}
      <motion.div
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full shadow-sm transition-colors duration-300 ${
          isDark ? "bg-gradient-to-r from-sky-400 to-sky-500" : "bg-white/15"
        }`}
        whileHover={{ scale: 1.05 }}
      >
        <motion.span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ x: isDark ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </motion.button>
  );
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  disenador: "Diseñador",
  programador: "Programador",
  director: "Director",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-300",
  disenador: "bg-sky-500/20 text-sky-300",
  programador: "bg-emerald-500/20 text-emerald-300",
  director: "bg-amber-500/20 text-amber-300",
};

const UserInfo = ({ isOpen }: { isOpen: boolean }) => {
  const { user, role, logout } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const firstName = (meta.first_name as string | undefined) ?? "";
  const lastName  = (meta.last_name  as string | undefined) ?? "";

  const initials = firstName || lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : (user.email ?? "U").charAt(0).toUpperCase();

  const displayName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : (user.email ?? "");

  /** Shared avatar element — reused in both trigger states */
  const Avatar = ({ size = 8 }: { size?: number }) => (
    <div
      className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {initials}
    </div>
  );

  /** Floating panel content — shared between both trigger modes */
  const PopoverPanel = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white uppercase"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-white/50">{user.email ?? ""}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[role ?? "disenador"]}`}
          >
            {ROLE_LABELS[role ?? "disenador"]}
          </span>
        </div>
      </div>

      <Separator className="bg-white/20" />

      {/* Configuración */}
      <div className="px-2 py-2">
        <Link
          to="/configuracion"
          onClick={() => setPopoverOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/85 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
        >
          <Settings size={16} className="shrink-0 text-white/70" />
          Configuración
        </Link>
      </div>

      <Separator className="bg-white/20" />

      {/* Cerrar sesión */}
      <div className="px-2 py-2">
        <button
          onClick={() => { setPopoverOpen(false); logout(); }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/85 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
        >
          <LogOut size={16} className="shrink-0 text-white/70" />
          Cerrar sesión
        </button>
      </div>
    </motion.div>
  );

  /* ── Collapsed: avatar-only trigger ── */
  if (!isOpen) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="flex w-full items-center justify-center rounded-lg bg-white/10 py-2.5 text-white/70 transition-all hover:bg-white/15 hover:text-white"
              >
                <Avatar size={8} />
              </motion.button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="border border-white/15 bg-slate-950/95 px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-black/40 backdrop-blur-sm"
          >
            {displayName || (user.email ?? "")}
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="right"
          align="end"
          sideOffset={12}
          className="w-64 sm:w-72 p-0 border border-white/10 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(to bottom, #0341a5, #0e7cf0)" }}
        >
          <PopoverPanel />
        </PopoverContent>
      </Popover>
    );
  }

  /* ── Expanded: full row trigger ── */
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left transition-all hover:bg-white/10 cursor-pointer"
        >
          <Avatar size={8} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-white/90">{displayName}</p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[role ?? "disenador"]}`}
            >
              {ROLE_LABELS[role ?? "disenador"]}
            </span>
          </div>
          <ChevronRight
            size={14}
            className={`shrink-0 text-white/30 transition-transform duration-200 ${popoverOpen ? "rotate-90" : ""}`}
          />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-64 sm:w-72 p-0 border border-white/10 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(to bottom, #0341a5, #0e7cf0)" }}
      >
        <PopoverPanel />
      </PopoverContent>
    </Popover>
  );
};


/**
 * AppSidebar
 *
 * Reads active route from React Router — no props required.
 * Navigation is driven by <Link> so the URL stays in sync at all times.
 */
const AppSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { pathname } = useLocation();
  const { role } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 64 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-20 flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0341a5] text-white"
    >
      {/* Header - Logo + toggle */}
      {isOpen ? (
        /* Expanded: logo left, toggle right — single row */
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <Logo isOpen={isOpen} />
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <PanelLeftClose size={16} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-white/10 bg-slate-950/95 text-xs font-medium text-white">
              Cerrar barra lateral
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        /* Collapsed: toggle on top row, logo on second row */
        <div className="flex flex-col border-b border-white/10">
          <div className="flex justify-end px-2 pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setIsOpen(!isOpen)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <PanelLeftOpen size={16} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-white/10 bg-slate-950/95 text-xs font-medium text-white">
                Abrir barra lateral
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex justify-center pb-4">
            <Logo isOpen={false} />
          </div>
        </div>
      )}

      {/* Navigation - Modern styling with UX best practices */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4 pb-4">
        <AnimatePresence>
          {appModules
            .filter((item) => !item.adminOnly || role === "admin")
            .map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <SidebarTooltip key={item.id} isOpen={isOpen} label={item.label}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={item.path}
                    className={`group relative flex w-full items-center overflow-hidden rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm ring-1 ring-white/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    } ${isOpen ? "gap-3" : "justify-center"}`}
                  >
                    {/* Active left accent */}
                    {isActive && (
                      <motion.span
                        layoutId="activeBar"
                        className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-white"
                      />
                    )}

                    <item.icon
                      size={19}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={`shrink-0 transition-all duration-200 ${
                        isActive ? "text-white" : "text-white/60 group-hover:text-white"
                      }`}
                    />

                    {isOpen && (
                      <span
                        className={`flex-1 whitespace-nowrap text-sm tracking-[0.01em] transition-colors duration-200 ${
                          isActive ? "font-semibold text-white" : "font-medium text-white/80 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </motion.div>
              </SidebarTooltip>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 mt-auto border-t border-white/10 bg-[#0341a5] px-2.5 pb-4 pt-3 space-y-2">
        <UserInfo isOpen={isOpen} />
        {/* TODO: dark mode — oculto hasta integración futura */}
        <div className="hidden">
          <DarkModeToggle isOpen={isOpen} />
        </div>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
