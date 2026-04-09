import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Droplets, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { appModules } from "@/modules/appModules";

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
        className="border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
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

  /* Collapsed: solo ícono clicable */
  if (!isOpen) {
    return (
      <SidebarTooltip isOpen={false} label={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}>
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-2xl py-2.5 text-sky-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </SidebarTooltip>
    );
  }

  /* Expanded: fila con label + pill switch */
  return (
    <button
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/10"
    >
      {isDark ? (
        <Sun size={15} className="shrink-0 text-sky-200" />
      ) : (
        <Moon size={15} className="shrink-0 text-sky-200" />
      )}
      <span className="flex-1 whitespace-nowrap text-left text-sm font-medium text-sky-100/80">
        {isDark ? "Modo claro" : "Modo oscuro"}
      </span>
      {/* Pill switch */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isDark ? "bg-sky-300" : "bg-white/20"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
            isDark ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </button>
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 64 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-20 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <div className={`flex items-center pb-4 pt-5 ${isOpen ? "gap-3 px-4" : "flex-col gap-3 px-3"}`}>
        {/* Logo */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/18 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
          <Droplets size={18} className="text-white" />
        </div>

        {/* Wordmark */}
        {isOpen && (
          <div className="min-w-0 flex-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="block whitespace-nowrap text-lg font-semibold tracking-[-0.03em] text-white"
            >
              aguApp
            </motion.span>
            <span className="block whitespace-nowrap text-[10px] uppercase tracking-[0.28em] text-sky-100/60">
              CENCOSUD URL SUITE
            </span>
          </div>
        )}

        {/* Toggle sidebar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sky-100/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isOpen
                ? <PanelLeftClose size={16} />
                : <PanelLeftOpen size={16} />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
          >
            {isOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
          </TooltipContent>
        </Tooltip>
      </div>

      <nav className="mt-1 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
        {appModules.map((item) => {
          const isActive = pathname === item.path;

          return (
            <SidebarTooltip key={item.id} isOpen={isOpen} label={item.label}>
              <Link
                to={item.path}
                className={`group relative flex w-full items-center overflow-hidden rounded-2xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-white text-[#0052A3]"
                    : "bg-transparent text-white hover:bg-sidebar-accent"
                } ${
                  isOpen ? "gap-3 px-4 py-2.5" : "justify-center px-0 py-2.5"
                }`}
              >
                <span
                  className={`absolute inset-y-2 left-0 w-[3px] rounded-full transition-opacity ${
                    isActive ? "bg-[#0052A3] opacity-100" : "opacity-0"
                  }`}
                />
                <item.icon
                  size={18}
                  strokeWidth={2}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-[#0052A3]" : "text-sky-100/80 group-hover:text-white"
                  }`}
                />
                {isOpen && (
                  <span
                    className={`flex-1 whitespace-nowrap text-left text-sm font-medium tracking-[0.01em] transition-colors ${
                      isActive ? "text-[#0052A3]" : "text-white group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </SidebarTooltip>
          );
        })}
      </nav>

      <div className="sticky bottom-0 z-10 mt-auto bg-[#0052A3] px-3 pb-4 pt-2">
        {/* Separador */}
        <div className="mb-2 h-px bg-white/10" />

        {/* Dark mode toggle */}
        <DarkModeToggle isOpen={isOpen} />
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
