/**
 * AppRouter
 *
 * Single source of truth for all routes.
 * Role-based access is enforced by RoleGuard per module.
 */
import { lazy, Suspense } from "react";
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
const AdminPage = lazy(() => import("@/pages/AdminPage"));

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
  return <RoleGuard path={path}><Lazy>{children}</Lazy></RoleGuard>;
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

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DefaultRedirect />} />
        <Route path="/constructor-url" element={<Guarded path="/constructor-url"><ConstructorUrlPage /></Guarded>} />
        <Route path="/banner-expand" element={<Guarded path="/banner-expand"><BannerExpandPage /></Guarded>} />
        <Route path="/configuracion" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/prompts" element={<Guarded path="/prompts"><PromptsPage /></Guarded>} />
        <Route path="/scripts" element={<Guarded path="/scripts"><ScriptsPage /></Guarded>} />
        <Route path="/ampscript-builder" element={<Guarded path="/ampscript-builder"><AMPscriptBuilderPage /></Guarded>} />
        <Route path="/admin" element={<Guarded path="/admin"><AdminPage /></Guarded>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
