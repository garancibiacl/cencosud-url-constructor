import LdrsLoader from "./LdrsLoader";

interface FullPageLoaderProps {
  label?: string;
  /** Use dark theme (for sidebar-bg pages like login) */
  dark?: boolean;
}

export default function FullPageLoader({ label = "Cargando", dark = false }: FullPageLoaderProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${dark ? "bg-sidebar" : "bg-background"}`}>
      <LdrsLoader
        size={40}
        color={dark ? "white" : "hsl(var(--primary))"}
        label={label}
      />
    </div>
  );
}
