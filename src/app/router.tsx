/**
 * AppRouter
 *
 * Single source of truth for all routes.
 */
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Hourglass } from "ldrs/react";
import "ldrs/react/Hourglass.css";
import AppShell from "./AppShell";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

// ─── Lazy feature imports ────────────────────────────────────────────────────
const LoginPage           = lazy(() => import("@/pages/LoginPage"));
const ResetPasswordPage   = lazy(() => import("@/pages/ResetPasswordPage"));
const ConstructorUrlPage  = lazy(() => import("@/features/constructor-url/ui/ConstructorUrlPage"));
const ImageOptimizerPage  = lazy(() => import("@/features/image-optimizer/ui/ImageOptimizerPage"));
const BannerExpandPage    = lazy(() => import("@/features/banner-expand/ui/BannerExpandPage"));
const HistoryPage         = lazy(() => import("@/features/history/ui/HistoryPage"));
const SettingsPage        = lazy(() => import("@/features/settings/ui/SettingsPage"));
const PromptsPage         = lazy(() => import("@/features/prompts/ui/PromptsPage"));
const ScriptsPage         = lazy(() => import("@/features/scripts/ui/ScriptsPage"));

// ─── Shared loading state ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="#0052A3" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ─── Route tree ─────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPasswordPage /></Lazy>} />

      {/* Protected routes inside AppShell */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/constructor-url" replace />} />
        <Route path="/constructor-url" element={<Lazy><ConstructorUrlPage /></Lazy>} />
        <Route path="/optimizador" element={<Lazy><ImageOptimizerPage /></Lazy>} />
        <Route path="/banner-expand" element={<Lazy><BannerExpandPage /></Lazy>} />
        <Route path="/historial" element={<Lazy><HistoryPage /></Lazy>} />
        <Route path="/configuracion" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="/prompts" element={<Lazy><PromptsPage /></Lazy>} />
        <Route path="/scripts" element={<Lazy><ScriptsPage /></Lazy>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
