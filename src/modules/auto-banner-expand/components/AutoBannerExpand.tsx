/**
 * AutoBannerExpand.tsx
 *
 * Main component for the Auto Banner Expand module.
 *
 * Responsibilities:
 * - Drag-and-drop / click-to-upload image input
 * - Preset selector
 * - Real-time preview with visual gap overlay
 * - "Expandir con IA" action button
 * - Progress / error feedback
 * - Result preview + export button
 * - Settings modal trigger (API key)
 */

import { useCallback, useRef, useState } from "react";
import {
  Upload, Settings, Wand2, Download, RotateCcw,
  AlertTriangle, Loader2, CheckCircle2, ImageIcon, Info,
} from "lucide-react";

import { Button }  from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BANNER_PRESETS } from "../types";
import { useAutoExpandBanner } from "../hooks/useAutoExpandBanner";
import { AISettingsModal }     from "./AISettingsModal";
import { getGapOverlayStyle }  from "../utils/maskGenerator";
import { describeGaps }        from "../utils/imageSizeUtils";
import { getStoredAPIKey }     from "../services/openaiImageEditService";

// ── Sub-components ────────────────────────────────────────────────────────

/** Visual overlay showing which areas will be filled by AI */
function GapOverlay({ leftPct, rightPct, topPct, bottomPct }: {
  leftPct: number; rightPct: number; topPct: number; bottomPct: number;
}) {
  const stripeClass = "absolute bg-violet-400/30 backdrop-blur-[1px] border border-dashed border-violet-400/60 flex items-center justify-center";
  return (
    <>
      {leftPct > 0.5 && (
        <div className={stripeClass} style={{ left: 0, top: 0, width: `${leftPct}%`, height: "100%" }}>
          <span className="text-[9px] font-bold text-violet-700 rotate-90 whitespace-nowrap">IA rellena</span>
        </div>
      )}
      {rightPct > 0.5 && (
        <div className={stripeClass} style={{ right: 0, top: 0, width: `${rightPct}%`, height: "100%" }}>
          <span className="text-[9px] font-bold text-violet-700 rotate-90 whitespace-nowrap">IA rellena</span>
        </div>
      )}
      {topPct > 0.5 && (
        <div className={stripeClass} style={{ top: 0, left: `${leftPct}%`, right: `${rightPct}%`, height: `${topPct}%` }}>
          <span className="text-[9px] font-bold text-violet-700">IA rellena</span>
        </div>
      )}
      {bottomPct > 0.5 && (
        <div className={stripeClass} style={{ bottom: 0, left: `${leftPct}%`, right: `${rightPct}%`, height: `${bottomPct}%` }}>
          <span className="text-[9px] font-bold text-violet-700">IA rellena</span>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface AutoBannerExpandProps {
  /** Which preset is selected by default */
  defaultPresetId?: string;
}

export function AutoBannerExpand({ defaultPresetId }: AutoBannerExpandProps) {
  const defaultPreset =
    BANNER_PRESETS.find((p) => p.id === defaultPresetId) ?? BANNER_PRESETS[0];

  const {
    status, statusMessage, errorMessage,
    originalDataUrl, resultDataUrl,
    analysis, preset,
    setPreset, loadImage, runExpansion, exportResult, reset,
  } = useAutoExpandBanner(defaultPreset);

  const [isDragging,       setIsDragging]       = useState(false);
  const [showSettings,     setShowSettings]      = useState(false);
  const [hasKey,           setHasKey]            = useState(() => !!getStoredAPIKey());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ───────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Computed ────────────────────────────────────────────────────────────

  const isLoading    = status === "loading";
  const isSuccess    = status === "success";
  const isError      = status === "error";
  const hasImage     = !!originalDataUrl;
  const needsExpand  = analysis?.needsExpansion ?? false;
  const canExpand    = hasImage && needsExpand && !isLoading;
  const displayUrl   = isSuccess && resultDataUrl ? resultDataUrl : originalDataUrl;

  // Gap overlay values (only shown on original, before expansion)
  const gapOverlay = analysis && !isSuccess
    ? getGapOverlayStyle(analysis)
    : null;

  // Progress % approximation from statusMessage
  const progressValue = isLoading ? (
    statusMessage.includes("máscara") ? 30 :
    statusMessage.includes("DALL-E")  ? 60 :
    statusMessage.includes("Recort")  ? 88 : 15
  ) : isSuccess ? 100 : 0;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Wand2 size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Auto Banner Expand</h2>
            <p className="text-xs text-muted-foreground">
              Expande automáticamente tu imagen al formato de banner con IA
            </p>
          </div>
        </div>

        <Button
          variant={hasKey ? "outline" : "default"}
          size="sm"
          className={`gap-2 ${!hasKey ? "border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100" : ""}`}
          onClick={() => setShowSettings(true)}
        >
          <Settings size={13} />
          {hasKey ? (
            <>Configuración IA <span className="h-2 w-2 rounded-full bg-green-500 inline-block ml-1" /></>
          ) : (
            "Configurar API Key"
          )}
        </Button>
      </div>

      {/* ── Preset info (static) ── */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-foreground mb-2">Formato de destino</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5">
              <ImageIcon size={11} /> {preset.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {preset.width}×{preset.height} px
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Ratio {(preset.width / preset.height).toFixed(2)}:1
            </Badge>
            {preset.maxWeightKb && (
              <Badge variant="outline" className="text-[10px]">
                Máx. {preset.maxWeightKb} KB
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Upload + Preview area ── */}
      <Card>
        <CardContent className="p-4">
          {!hasImage ? (
            /* Dropzone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                min-h-[200px] cursor-pointer transition-all
                ${isDragging
                  ? "border-violet-500 bg-violet-50 scale-[1.01]"
                  : "border-border hover:border-violet-400 hover:bg-violet-50/40"}
              `}
            >
              <Upload size={28} className="text-violet-400 mb-3" />
              <p className="text-sm font-semibold text-foreground">Arrastra tu imagen aquí</p>
              <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar · JPG, PNG</p>
            </div>
          ) : (
            /* Preview */
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                  Vista Previa — {preset.width}×{preset.height} px
                  {isSuccess && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">
                      <CheckCircle2 size={9} className="mr-1" /> Expandida con IA
                    </Badge>
                  )}
                </span>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={reset}>
                  <RotateCcw size={11} /> Nueva imagen
                </Button>
              </div>

              {/* Banner-shaped preview container */}
              <div
                className="relative w-full rounded-xl border border-border overflow-hidden bg-[#f4f4f4]"
                style={{ aspectRatio: `${preset.width} / ${preset.height}`, maxHeight: 300 }}
              >
                <img
                  src={displayUrl!}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Gap overlay — only on original before expansion */}
                {gapOverlay && needsExpand && !isLoading && (
                  <GapOverlay {...gapOverlay} />
                )}

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="text-white animate-spin" />
                    <p className="text-white text-xs font-semibold">Expandiendo imagen…</p>
                    {statusMessage && (
                      <p className="text-white/70 text-[10px]">{statusMessage}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {isLoading && (
                <Progress value={progressValue} className="mt-2 h-1.5" />
              )}

              {/* Gap analysis callout */}
              {!isSuccess && analysis && needsExpand && !isLoading && (
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 flex items-start gap-2">
                  <Info size={13} className="text-violet-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-violet-800">
                    Se detectaron <strong>{describeGaps(analysis)}</strong> respecto al formato{" "}
                    <strong>{preset.label}</strong>.
                    La IA extenderá el fondo para cubrirlos sin modificar el producto.
                  </p>
                </div>
              )}

              {/* No expansion needed */}
              {!isSuccess && analysis && !needsExpand && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  <p className="text-[11px] text-green-800">
                    La imagen ya cubre el formato seleccionado. No se necesita expansión.
                  </p>
                </div>
              )}

              {/* Error */}
              {isError && errorMessage && (
                <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 flex items-start gap-2">
                  <AlertTriangle size={13} className="text-destructive mt-0.5 shrink-0" />
                  <p className="text-[11px] text-destructive">{errorMessage}</p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {/* ── Action buttons ── */}
      {hasImage && (
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!canExpand}
            onClick={runExpansion}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" /> Expandiendo…</>
              : <><Wand2 size={15} /> Expandir con IA</>}
          </Button>

          {isSuccess && (
            <Button variant="outline" className="gap-2" onClick={exportResult}>
              <Download size={15} />
              Exportar .jpg
            </Button>
          )}

          {!hasKey && (
            <Button
              variant="outline"
              className="gap-2 border-amber-400 text-amber-800 hover:bg-amber-50"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={14} />
              Configurar API Key primero
            </Button>
          )}
        </div>
      )}

      {/* ── Settings modal ── */}
      <AISettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onKeyChange={setHasKey}
      />
    </div>
  );
}
