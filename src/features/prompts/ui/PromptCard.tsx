import { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { copyPromptToClipboard } from "../services/prompts.service";
import type { Prompt } from "../logic/prompts.types";

const CATEGORY_LABELS: Record<Prompt["category"], string> = {
  "imagen-producto": "Imagen producto",
  "banner-campaña": "Banner campaña",
  "relleno-generativo": "Relleno generativo",
  "copy-marketing": "Copy marketing",
  "social-media": "Social media",
};

const TONE_LABELS: Record<Prompt["tone"], string> = {
  formal: "Formal",
  casual: "Casual",
  urgente: "Urgente",
  aspiracional: "Aspiracional",
};

const BRAND_COLORS: Record<Prompt["brand"], string> = {
  Paris: "bg-blue-100 text-blue-800 border-blue-200",
  Jumbo: "bg-green-100 text-green-800 border-green-200",
  "Santa Isabel": "bg-orange-100 text-orange-800 border-orange-200",
  SISA: "bg-purple-100 text-purple-800 border-purple-200",
  Generico: "bg-secondary text-secondary-foreground border-border",
};

interface Props {
  prompt: Prompt;
}

export function PromptCard({ prompt }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyPromptToClipboard(prompt.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card className="card-interactive group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{prompt.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{prompt.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopy}
            title="Copiar prompt"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              BRAND_COLORS[prompt.brand]
            }`}
          >
            {prompt.brand}
          </span>
          <Badge variant="outline" className="text-[11px]">
            {CATEGORY_LABELS[prompt.category]}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {TONE_LABELS[prompt.tone]}
          </Badge>
          {prompt.model && (
            <Badge variant="secondary" className="text-[11px]">
              {prompt.model}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Prompt content */}
        <div
          className={`relative rounded-xl bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground transition-all ${
            expanded ? "" : "max-h-[80px] overflow-hidden"
          }`}
        >
          {prompt.content}
          {!expanded && (
            <div className="absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-muted/50 to-transparent" />
          )}
        </div>

        {/* Variables */}
        {prompt.variables && prompt.variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.variables.map((v) => (
              <span
                key={v}
                className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 ring-1 ring-amber-200"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {prompt.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Ver completo
              </>
            )}
          </button>

          <Button
            size="sm"
            variant={copied ? "outline" : "default"}
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
