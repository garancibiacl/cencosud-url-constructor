import { useState, useEffect } from "react";
import { Link, Image, History, Settings, ChevronLeft, ChevronRight, Moon, Sun, Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { id: "url-generator", label: "Generador de URLs", icon: Link },
  { id: "optimizer", label: "Optimizador de Imágenes", icon: Image, comingSoon: true },
  { id: "history", label: "Historial de Campañas", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
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
      className="w-full flex items-center gap-3 px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
      title={isOpen ? undefined : (isDark ? "Light Mode" : "Dark Mode")}
    >
      {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
      {isOpen && (
        <span className="text-sm whitespace-nowrap">{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
};

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 z-20 overflow-hidden"
    >
      <div className="p-5 flex items-center gap-3 h-16">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <div className="w-3.5 h-3.5 bg-accent rounded-full" />
        </div>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold tracking-tight text-lg text-sidebar-foreground whitespace-nowrap"
          >
            Agencia Aua
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => !item.comingSoon && onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              } ${item.comingSoon ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={item.comingSoon}
              title={isOpen ? undefined : item.label}
            >
              <item.icon size={20} className="shrink-0" />
              {isOpen && (
                <span className="text-sm flex-1 text-left whitespace-nowrap">{item.label}</span>
              )}
              {isOpen && item.comingSoon && (
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded uppercase tracking-tight font-medium text-muted-foreground">
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
          className="w-full p-4 border-t border-sidebar-border flex justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
