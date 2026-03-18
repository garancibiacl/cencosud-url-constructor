import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import URLBuilder from "@/components/URLBuilder";
import ImageOptimizer from "@/components/ImageOptimizer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("url-generator");

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-accent/30">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === "url-generator" && <URLBuilder />}
        {activeTab === "optimizer" && <ImageOptimizer />}
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
