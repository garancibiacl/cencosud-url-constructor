import { useState } from "react";
import { Code2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useScripts } from "../hooks/useScripts";
import { ScriptCard } from "./ScriptCard";
import { UploadScriptModal } from "./UploadScriptModal";
import LdrsLoader from "@/components/LdrsLoader";

export default function ScriptsPage() {
  const { role } = useAuth();
  const { scripts, loading, refresh } = useScripts();
  const [modalOpen, setModalOpen] = useState(false);

  const canDelete = role === "admin";

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Code2 className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Scripts de Illustrator
            </h1>
            <p className="text-sm text-muted-foreground">
              Scripts .jsx listos para ejecutar en Adobe Illustrator. Generados con IA.
            </p>
          </div>

          <Button
            variant="brand"
            onClick={() => setModalOpen(true)}
            className="h-10 rounded-xl px-4 gap-2 shrink-0"
          >
            <Upload className="h-4 w-4" />
            Cargar .jsx
          </Button>
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="border-b border-border bg-muted/30 px-8 py-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Cómo usar:</strong> descarga el archivo .jsx →
          en Illustrator ve a <strong className="text-foreground">Archivo → Scripts → Otro script...</strong> →
          selecciona el archivo descargado.
        </p>
      </div>

      {/* Grid */}
      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <LdrsLoader size={28} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {scripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                canEdit={true}
                canDelete={canDelete}
                onDelete={refresh}
                onUpdate={refresh}
              />
            ))}
          </div>
        )}
      </main>

      <UploadScriptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploaded={refresh}
      />
    </div>
  );
}
