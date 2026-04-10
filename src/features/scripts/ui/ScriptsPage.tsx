import { Code2 } from "lucide-react";
import { getAllScripts } from "../services/scripts.service";
import { ScriptCard } from "./ScriptCard";

export default function ScriptsPage() {
  const scripts = getAllScripts();

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Code2 className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Scripts de Illustrator
            </h1>
            <p className="text-sm text-muted-foreground">
              Scripts .jsx listos para ejecutar en Adobe Illustrator. Generados con IA.
            </p>
          </div>
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
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 max-w-5xl">
          {scripts.map((script) => (
            <ScriptCard key={script.id} script={script} />
          ))}
        </div>
      </main>
    </div>
  );
}
