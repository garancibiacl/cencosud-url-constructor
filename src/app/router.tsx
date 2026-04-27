/**
 * AppRouter
 *
 * Single source of truth for all routes.
 * Role-based access is enforced by RoleGuard per module.
 */
import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";
import LdrsLoader from "@/components/LdrsLoader";
import { useAuth } from "@/hooks/useAuth";
import { appModules, canAccessModule } from "@/modules/appModules";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const ForceChangePassword = lazy(() => import("@/pages/ForceChangePassword"));
const ConstructorUrlPage = lazy(() => import("@/features/constructor-url/ui/ConstructorUrlPage"));
const BannerExpandPage = lazy(() => import("@/features/banner-expand/ui/BannerExpandPage"));
const SettingsPage = lazy(() => import("@/features/settings/ui/SettingsPage"));
const PromptsPage = lazy(() => import("@/features/prompts/ui/PromptsPage"));
const ScriptsPage = lazy(() => import("@/features/scripts/ui/ScriptsPage"));
const AMPscriptBuilderPage = lazy(() => import("@/features/ampscript-builder/ui/AMPscriptBuilderPage"));
const MailingBuilderPage = lazy(() => import("@/features/mailing-builder/ui/MailingBuilderPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AdminUsuariosPage = lazy(() => import("@/pages/admin/AdminUsuariosPage"));
const AdminAccesosPage = lazy(() => import("@/pages/admin/AdminAccesosPage"));
const AdminArchivosPage = lazy(() => import("@/pages/admin/AdminArchivosPage"));
const FileBankPage = lazy(() => import("@/features/file-bank/ui/FileBankPage"));
const SharedFilePage = lazy(() => import("@/features/file-bank/ui/SharedFilePage"));
const PublicFilePage = lazy(() => import("@/features/file-bank/ui/PublicFilePage"));

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[RouteErrorBoundary]", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm font-semibold text-destructive">Error al cargar el módulo</p>
          <pre className="max-w-xl overflow-auto rounded-lg border border-border bg-secondary/40 p-4 text-left text-xs text-foreground/80">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack?.split("\n").slice(0, 8).join("\n")}
          </pre>
          <button
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <LdrsLoader size={28} />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function Guarded({ path, children }: { path: string; children: React.ReactNode }) {
  return <RouteErrorBoundary><RoleGuard path={path}><Lazy>{children}</Lazy></RoleGuard></RouteErrorBoundary>;
}

/** Redirects to the first module the current user's role can access */
function DefaultRedirect() {
  const { role, loading, user } = useAuth();

  // Solo blanquear en carga inicial (sin usuario conocido).
  if (loading && !user) return null;

  const first = appModules.find((m) => canAccessModule(m, role));
  return <Navigate to={first?.path ?? "/login"} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPasswordPage /></Lazy>} />
      <Route path="/cambio-pass" element={<Lazy><ForceChangePassword /></Lazy>} />

      {/* Public file preview — no login, no AppShell */}
      <Route path="/p/:slug" element={<Lazy><PublicFilePage /></Lazy>} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DefaultRedirect />} />
        <Route path="/constructor-url" element={<Guarded path="/constructor-url"><ConstructorUrlPage /></Guarded>} />
        <Route path="/banner-expand" element={<Guarded path="/banner-expand"><BannerExpandPage /></Guarded>} />
        <Route path="/configuracion" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/prompts" element={<Guarded path="/prompts"><PromptsPage /></Guarded>} />
        <Route path="/scripts" element={<Guarded path="/scripts"><ScriptsPage /></Guarded>} />
        <Route path="/ampscript-builder" element={<Guarded path="/ampscript-builder"><AMPscriptBuilderPage /></Guarded>} />
        <Route path="/mailing-builder" element={<Guarded path="/mailing-builder"><MailingBuilderPage /></Guarded>} />
        <Route path="/admin" element={<Guarded path="/admin"><AdminPage /></Guarded>} />
        <Route path="/admin/usuarios" element={<Guarded path="/admin"><AdminUsuariosPage /></Guarded>} />
        <Route path="/admin/accesos" element={<Guarded path="/admin"><AdminAccesosPage /></Guarded>} />
        <Route path="/admin/archivos" element={<Guarded path="/admin"><AdminArchivosPage /></Guarded>} />
        <Route path="/banco-archivos" element={<Guarded path="/banco-archivos"><FileBankPage /></Guarded>} />
        <Route path="/banco-archivos/:slug" element={<Lazy><SharedFilePage /></Lazy>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
