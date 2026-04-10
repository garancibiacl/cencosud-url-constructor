import { useState } from "react";
import { Check, Copy, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { copyScriptCode, downloadScript } from "../services/scripts.service";
import type { IllustratorScript } from "../logic/scripts.types";

interface Props {
  script: IllustratorScript;
}

export function ScriptCard({ script }: Props) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyScriptCode(script.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card className="card-interactive flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* App badge */}
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-200">
                {script.app}
              </span>
              <span className="text-[11px] text-muted-foreground">.jsx</span>
            </div>
            <p className="mt-1.5 font-semibold text-foreground">{script.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{script.description}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {script.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">

        {/* Prompt usado */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
          <button
            onClick={() => setPromptOpen(!promptOpen)}
            className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Prompt usado con la IA</span>
            {promptOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {promptOpen && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {script.prompt}
            </p>
          )}
        </div>

        {/* Código JSX */}
        <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="font-mono text-[11px] text-slate-400">{script.filename}</span>
            <button
              onClick={() => setCodeOpen(!codeOpen)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              {codeOpen ? (
                <><ChevronUp className="h-3 w-3" />Ocultar</>
              ) : (
                <><ChevronDown className="h-3 w-3" />Ver código</>
              )}
            </button>
          </div>
          {codeOpen && (
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre">
              {script.code}
            </pre>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 border-t border-border pt-2">
          <Button
            size="sm"
            onClick={() => downloadScript(script)}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar .jsx
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 text-green-500" />Copiado</>
            ) : (
              <><Copy className="h-3.5 w-3.5" />Copiar código</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
