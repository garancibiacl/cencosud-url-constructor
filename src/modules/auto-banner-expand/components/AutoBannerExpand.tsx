/**
 * AutoBannerExpand.tsx
 *
 * Main component for the Auto Banner Expand module.
 *
 * Responsibilities:
 * - Drag-and-drop / click-to-upload image input
 * - Preset selector dropdown
 * - Focus position control (left / center / right) + fine-tune slider
 * - "Preserve elements" toggle (labels, seals, text)
 * - Real-time preview with visual gap overlay
 * - "Expandir con IA" action button
 * - Progress / error feedback
 * - Result preview + export button
 * - Settings modal trigger (API key)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Settings, Wand2, Download, RotateCcw,
  AlertTriangle, Loader2, CheckCircle2, ImageIcon, Info,
  AlignLeft, AlignCenter, AlignRight, Tag, SlidersHorizontal,
  ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }    from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider }   from "@/components/ui/slider";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { BANNER_PRESETS } from "../types";
import type { FocusPosition } from "../types";
import { useAutoExpandBanner }  from "../hooks/useAutoExpandBanner";
import { AISettingsModal }       from "./AISettingsModal";
import { getGapOverlayStyle }    from "../utils/maskGenerator";
import { describeGaps }          from "../utils/imageSizeUtils";
import { getStoredAPIKey, buildDynamicPrompt } from "../services/openaiImageEditService";

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

// ── Custom preset ─────────────────────────────────────────────────────────

const CUSTOM_PRESET_ID = "__custom__";

// ── Focus position helpers ─────────────────────────────────────────────────

const FOCUS_BUTTONS: { value: FocusPosition; label: string; Icon: React.ElementType }[] = [
  { value: "left",   label: "Izquierda", Icon: AlignLeft   },
  { value: "center", label: "Centro",    Icon: AlignCenter },
  { value: "right",  label: "Derecha",   Icon: AlignRight  },
];

/** Map focusX (0–100) to the nearest FocusPosition bucket */
function focusXToPosition(x: number): FocusPosition {
  if (x < 33) return "left";
  if (x > 67) return "right";
  return "center";
}

/** Map a FocusPosition preset to a representative focusX value */
const POSITION_TO_X: Record<FocusPosition, number> = {
  left: 15,
  center: 50,
  right: 85,
};

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
    focusX, setFocusX,
    hasElements, setHasElements,
    sceneDescription, setSceneDescription,
    setPreset, loadImage, runExpansion, exportResult, reset,
  } = useAutoExpandBanner(defaultPreset);

  const [isDragging,   setIsDragging]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey,       setHasKey]       = useState(() => !!getStoredAPIKey());
  const [showPrompt,   setShowPrompt]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Custom preset state ─────────────────────────────────────────────────
  const [isCustom,     setIsCustom]     = useState(false);
  const [customW,      setCustomW]      = useState("");
  const [customH,      setCustomH]      = useState("");

  // Build and apply custom preset when both inputs are valid numbers
  useEffect(() => {
    if (!isCustom) return;
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!w || !h || w < 10 || h < 10) return;
    setPreset({
      id: CUSTOM_PRESET_ID,
      label: `Personalizado (${w}×${h})`,
      width: w,
      height: h,
      category: "Personalizado",
    });
  }, [customW, customH, isCustom, setPreset]);

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

  const isLoading   = status === "loading";
  const isSuccess   = status === "success";
  const isError     = status === "error";
  const hasImage    = !!originalDataUrl;
  const needsExpand = analysis?.needsExpansion ?? false;
  const canExpand   = hasImage && needsExpand && !isLoading;
  const displayUrl  = isSuccess && resultDataUrl ? resultDataUrl : originalDataUrl;

  const activePosition = focusXToPosition(focusX);
  const livePrompt     = buildDynamicPrompt(activePosition, hasElements, sceneDescription);

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

      {/* ── Preset selector ── */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-foreground mb-2">Formato de destino</p>
          <Select
            value={isCustom ? CUSTOM_PRESET_ID : preset.id}
            onValueChange={(id) => {
              if (id === CUSTOM_PRESET_ID) {
                setIsCustom(true);
                return;
              }
              setIsCustom(false);
              setCustomW("");
              setCustomH("");
              const found = BANNER_PRESETS.find((p) => p.id === id);
              if (found) setPreset(found);
            }}
          >
            <SelectTrigger className="w-full text-sm border-border">
              <SelectValue placeholder="Selecciona un formato de Cencosud..." />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const groups = new Map<string, typeof BANNER_PRESETS>();
                for (const p of BANNER_PRESETS) {
                  if (!groups.has(p.category)) groups.set(p.category, []);
                  groups.get(p.category)!.push(p);
                }
                return Array.from(groups.entries()).map(([cat, items]) => (
                  <SelectGroup key={cat}>
                    <SelectLabel className="text-xs font-bold text-foreground px-2 py-1.5">
                      {cat}
                    </SelectLabel>
                    {items.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ));
              })()}

              {/* Personalizado */}
              <SelectGroup>
                <SelectLabel className="text-xs font-bold text-foreground px-2 py-1.5">
                  Personalizado
                </SelectLabel>
                <SelectItem value={CUSTOM_PRESET_ID} className="text-sm gap-2">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={12} className="text-violet-500" />
                    Medidas personalizadas…
                  </span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Custom dimension inputs */}
          {isCustom && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block">Ancho (px)</label>
                <Input
                  type="number"
                  min={10}
                  max={9999}
                  placeholder="ej. 1920"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <span className="text-muted-foreground text-sm mt-4">×</span>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block">Alto (px)</label>
                <Input
                  type="number"
                  min={10}
                  max={9999}
                  placeholder="ej. 400"
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center mt-2.5">
            {(!isCustom || (parseInt(customW) > 0 && parseInt(customH) > 0)) && (
              <>
                <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5">
                  <ImageIcon size={11} /> {preset.width}×{preset.height} px
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Ratio {(preset.width / preset.height).toFixed(2)}:1
                </Badge>
                {preset.maxWeightKb && (
                  <Badge variant="outline" className="text-[10px]">
                    Máx. {preset.maxWeightKb} KB
                  </Badge>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Composition controls ── */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          {/* Focus position */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Posición del foco (sujeto principal)
            </p>
            <div className="flex gap-2">
              {FOCUS_BUTTONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setFocusX(POSITION_TO_X[value])}
                  className={`
                    flex-1 flex flex-col items-center gap-1 rounded-lg border py-2 px-1 text-[11px] font-medium
                    transition-all cursor-pointer
                    ${activePosition === value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-border text-muted-foreground hover:border-violet-300 hover:bg-violet-50/40"}
                  `}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Fine-tune slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">Ajuste fino horizontal</p>
              <span className="text-[11px] font-mono text-muted-foreground">{focusX}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[focusX]}
              onValueChange={([v]) => setFocusX(v)}
              className="[&_[role=slider]]:bg-violet-600 [&_[role=slider]]:border-violet-600"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>← Izquierda</span>
              <span>Derecha →</span>
            </div>
          </div>

          {/* Preserve elements toggle */}
          <button
            onClick={() => setHasElements(!hasElements)}
            className={`
              flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left w-full
              transition-all cursor-pointer
              ${hasElements
                ? "border-amber-400 bg-amber-50"
                : "border-border hover:border-amber-300 hover:bg-amber-50/40"}
            `}
          >
            <div className={`
              flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors
              ${hasElements ? "border-amber-500 bg-amber-500" : "border-muted-foreground/40"}
            `}>
              {hasElements && <Tag size={10} className="text-white" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">
                Contiene sellos, precios o texto
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                La IA preservará estos elementos sin distorsión ni duplicación
              </p>
            </div>
          </button>

          {/* Scene description input */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Descripción de la escena
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              placeholder="ej. madera cálida, luz natural lateral, tonos tierra, fondo difuminado…"
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none placeholder:text-muted-foreground/60"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Describe materiales, colores o iluminación del fondo para guiar a la IA.
            </p>
          </div>

          {/* Live prompt preview */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setShowPrompt((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sparkles size={12} className="text-violet-500" />
                Prompt dinámico generado
              </span>
              {showPrompt
                ? <ChevronUp size={13} className="text-muted-foreground" />
                : <ChevronDown size={13} className="text-muted-foreground" />}
            </button>
            {showPrompt && (
              <div className="px-3 py-2.5 bg-muted/20">
                <p className="text-[11px] leading-relaxed text-foreground font-mono whitespace-pre-wrap break-words">
                  {livePrompt}
                </p>
              </div>
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
                  style={{
                    objectPosition: isSuccess ? "center" : `${focusX}% 50%`,
                  }}
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
