/**
 * AppRouter
 *
 * Single source of truth for all routes.
 */
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import LdrsLoader from "@/components/LdrsLoader";

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

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPasswordPage /></Lazy>} />
      <Route path="/cambio-pass" element={<Lazy><ForceChangePassword /></Lazy>} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/constructor-url" replace />} />
        <Route path="/constructor-url" element={<Lazy><ConstructorUrlPage /></Lazy>} />
        <Route path="/banner-expand" element={<Lazy><BannerExpandPage /></Lazy>} />
        <Route path="/configuracion" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/prompts" element={<Lazy><PromptsPage /></Lazy>} />
        <Route path="/scripts" element={<Lazy><ScriptsPage /></Lazy>} />
        <Route path="/ampscript-builder" element={<Lazy><AMPscriptBuilderPage /></Lazy>} />
        <Route path="/admin" element={<Lazy><AdminPage /></Lazy>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
