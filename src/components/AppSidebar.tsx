import { useEffect, useState } from "react";
import { Link, Image, History, Settings, ChevronLeft, ChevronRight, Moon, Sun, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { id: "url-generator", label: "Constructor de URLs", icon: Link },
  { id: "optimizer", label: "Optimizador de Imagenes", icon: Image },
  { id: "history", label: "Historial de Campanas", icon: History },
  { id: "settings", label: "Configuracion", icon: Settings },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

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

  return (
    <SidebarTooltip isOpen={isOpen} label={isDark ? "Light Mode" : "Dark Mode"}>
      <button
        onClick={() => setIsDark(!isDark)}
        className={`group flex w-full items-center rounded-2xl text-sky-100/78 transition-all duration-200 hover:bg-sidebar-accent hover:text-white ${
          isOpen ? "gap-3 px-4 py-2.5" : "justify-center px-0 py-2.5"
        }`}
      >
        {isDark ? (
          <Sun size={18} className="shrink-0 text-sky-200 transition-colors group-hover:text-white" />
        ) : (
          <Moon size={18} className="shrink-0 text-sky-200 transition-colors group-hover:text-white" />
        )}
        {isOpen && (
          <span className="whitespace-nowrap text-sm font-medium tracking-[0.01em]">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </button>
    </SidebarTooltip>
  );
};

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 64 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-20 flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <div className={`px-4 pb-5 pt-6 ${isOpen ? "" : "px-3"}`}>
        <div className={`flex items-center ${isOpen ? "gap-4" : "justify-center"}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/18 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
            <Droplets size={20} className="text-white" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="block whitespace-nowrap text-xl font-semibold tracking-[-0.03em] text-white"
              >
                aguApp
              </motion.span>
              <span className="mt-1 block whitespace-nowrap text-[11px] uppercase tracking-[0.28em] text-sky-100/70">
                CENCOSUD URL SUITE
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-1 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const button = (
            <button
              key={item.id}
              onClick={() => !item.comingSoon && onTabChange(item.id)}
              className={`group relative flex w-full items-center overflow-hidden rounded-2xl text-left transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#0052A3]"
                  : "bg-transparent text-white hover:bg-sidebar-accent"
              } ${item.comingSoon ? "opacity-80" : ""} ${
                isOpen ? "gap-3 px-4 py-2.5" : "justify-center px-0 py-2.5"
              }`}
              disabled={item.comingSoon}
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
              {isOpen && item.comingSoon && (
                <span className="rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950">
                  Soon
                </span>
              )}
            </button>
          );

          return (
            <SidebarTooltip key={item.id} isOpen={isOpen} label={item.label}>
              {button}
            </SidebarTooltip>
          );
        })}
      </nav>

      <div className="sticky bottom-0 z-10 mt-auto border-t border-white/10 bg-[#0052A3] px-3 pb-3 pt-3">
        <DarkModeToggle isOpen={isOpen} />
        <SidebarTooltip isOpen={isOpen} label={isOpen ? "Colapsar sidebar" : "Expandir sidebar"}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-2 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-0 py-2.5 text-sky-100/78 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </SidebarTooltip>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
