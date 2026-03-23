import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import URLBuilder from "@/components/URLBuilder";
import ImageOptimizer from "@/components/ImageOptimizer";
import { AutoBannerExpand } from "@/modules/auto-banner-expand";

const Index = () => {
  const [activeTab, setActiveTab] = useState("url-generator");

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-accent/30">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === "url-generator" && <URLBuilder />}
        {activeTab === "optimizer" && <ImageOptimizer />}
        {activeTab === "banner-expand" && (
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Header */}
            <div className="border-b border-border bg-card px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Relleno Generativo IA
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Expande imágenes de producto a formatos banner con DALL-E 2 — sin Photoshop
                  </p>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 p-8">
              <div className="max-w-3xl mx-auto">
                <AutoBannerExpand defaultPresetId="huincha_desktop" />
              </div>
            </div>
          </div>
        )}
        {activeTab === "history" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Historial de Campañas</h2>
              <p className="text-muted-foreground">El historial estará disponible próximamente.</p>
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Configuración</h2>
              <p className="text-muted-foreground">Ajustes de la aplicación próximamente.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
