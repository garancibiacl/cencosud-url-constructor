/**
 * AppShell
 *
 * Root layout for all authenticated/main routes.
 * Renders the sidebar and the active feature via <Outlet />.
 * No feature-specific logic lives here.
 */
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";

export default function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans selection:bg-accent/30">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
