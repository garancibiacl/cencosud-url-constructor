import { useEffect, useState } from "react";
import { Link, Image, History, Settings, ChevronLeft, ChevronRight, Moon, Sun, Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { id: "url-generator", label: "Constructor de URLs", icon: Link },
  { id: "optimizer", label: "Optimizador de Imagenes", icon: Image, comingSoon: true },
  { id: "history", label: "Historial de Campanas", icon: History },
  { id: "settings", label: "Configuracion", icon: Settings },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

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
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex w-full items-center gap-3 px-6 py-3 text-muted-foreground transition-colors hover:text-foreground"
      title={isOpen ? undefined : isDark ? "Light Mode" : "Dark Mode"}
    >
      {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
      {isOpen && <span className="whitespace-nowrap text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
};

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 78 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-20 flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm">
          <Droplets size={18} className="text-primary-foreground" />
        </div>
        {isOpen && (
          <div className="min-w-0">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="block whitespace-nowrap text-lg font-bold tracking-tight text-sidebar-foreground"
            >
              aguApp
            </motion.span>
            <span className="block whitespace-nowrap text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Cencosud URL Suite
            </span>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.comingSoon && onTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              } ${item.comingSoon ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={item.comingSoon}
              title={isOpen ? undefined : item.label}
            >
              <item.icon size={20} className="shrink-0" />
              {isOpen && <span className="flex-1 whitespace-nowrap text-left text-sm font-medium">{item.label}</span>}
              {isOpen && item.comingSoon && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border">
        <DarkModeToggle isOpen={isOpen} />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full justify-center border-t border-sidebar-border p-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
