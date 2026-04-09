/**
 * AppRouter
 *
 * Single source of truth for all routes.
 * Each feature is lazy-loaded — zero cost until the user navigates to it.
 *
 * HOW TO ADD A NEW ROUTE (3 steps):
 *  1. Create your feature in src/features/<feature-name>/  (copy _template-feature)
 *  2. Add a lazy import below
 *  3. Add a <Route> inside the AppShell group
 *     — also register it in src/modules/appModules.ts so the sidebar picks it up
 */
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import NotFound from "@/pages/NotFound";

// ─── Lazy feature imports ────────────────────────────────────────────────────
const ConstructorUrlPage  = lazy(() => import("@/features/constructor-url/ui/ConstructorUrlPage"));
const ImageOptimizerPage  = lazy(() => import("@/features/image-optimizer/ui/ImageOptimizerPage"));
const BannerExpandPage    = lazy(() => import("@/features/banner-expand/ui/BannerExpandPage"));
const HistoryPage         = lazy(() => import("@/features/history/ui/HistoryPage"));
const SettingsPage        = lazy(() => import("@/features/settings/ui/SettingsPage"));
const PromptsPage         = lazy(() => import("@/features/prompts/ui/PromptsPage"));

// ─── Shared loading state ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
      {/* All routes inside AppShell share the sidebar layout */}
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/constructor-url" replace />} />

        <Route
          path="/constructor-url"
          element={<Lazy><ConstructorUrlPage /></Lazy>}
        />
        <Route
          path="/optimizador"
          element={<Lazy><ImageOptimizerPage /></Lazy>}
        />
        <Route
          path="/banner-expand"
          element={<Lazy><BannerExpandPage /></Lazy>}
        />
        <Route
          path="/historial"
          element={<Lazy><HistoryPage /></Lazy>}
        />
        <Route
          path="/configuracion"
          element={<Lazy><SettingsPage /></Lazy>}
        />
        <Route
          path="/prompts"
          element={<Lazy><PromptsPage /></Lazy>}
        />
      </Route>

      {/* Catch-all — keep below all real routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
