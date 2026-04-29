import React, {
  lazy, Suspense,
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  ArrowLeft, Check, Code2, Copy, GripVertical, RefreshCw, X,
  FileJson2, FileCode2, Sun, Moon,
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { renderMailingHtml } from "../logic/exporters/renderMailingHtml";
import type { MailingDocument } from "../logic/schema/mailing.types";

// ─── Lazy-load del editor HTML (CodeMirror) ───────────────────────────────────
// El chunk de CodeMirror (~400 KB) sólo se descarga cuando se abre Dev Mode.

const HtmlCodeEditor = lazy(() =>
  import("./HtmlCodeEditor").then((m) => ({ default: m.HtmlCodeEditor })),
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DevModePanelProps {
  document: MailingDocument;
  activeMailingId: string | null;
  onClose: () => void;
  onApply: (doc: MailingDocument, mailingId: string | null) => void;
}

type EditorMode = "json" | "html";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function tryParseDoc(text: string): { doc: MailingDocument; error: null } | { doc: null; error: string } {
  try {
    return { doc: JSON.parse(text) as MailingDocument, error: null };
  } catch (e) {
    return { doc: null, error: e instanceof Error ? e.message : "JSON inválido" };
  }
}

// ─── Skeleton del editor mientras carga CodeMirror ────────────────────────────

function EditorSkeleton() {
  return (
    <div className="flex h-full items-center justify-center" style={{ backgroundColor: "#1e1e1e" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span className="text-xs" style={{ color: "#9d9d9d" }}>Cargando editor…</span>
      </div>
    </div>
  );
}

// ─── JsonTextEditor — textarea minimalista para el modo JSON ──────────────────

function JsonTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Números de línea */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: 0, left: 0, width: 48,
          paddingTop: 16, paddingBottom: 16,
          userSelect: "none",
          fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
          fontSize: 13, lineHeight: "1.6",
          color: "#858585", textAlign: "right",
          backgroundColor: "#1e1e1e", borderRight: "1px solid #3e3e42",
          overflow: "hidden",
          transform: `translateY(${-scrollTop}px)`,
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} style={{ paddingRight: 8, paddingLeft: 8 }}>{i + 1}</div>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => setScrollTop((e.target as HTMLTextAreaElement).scrollTop)}
        aria-label="Editor JSON del documento"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="absolute inset-0 h-full w-full resize-none border-0 outline-none"
        style={{
          fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
          fontSize: 13, lineHeight: "1.6",
          backgroundColor: "#1e1e1e", color: "#d4d4d4",
          padding: "16px 16px 16px 64px",
          caretColor: "#d4d4d4", tabSize: 2,
        }}
      />
    </div>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

function StatusDot({ error }: { error: string | null }) {
  return (
    <div className="flex items-center gap-1.5" title={error ?? "Válido"}>
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: error ? "#ef4444" : "#22c55e" }}
      />
      <span className="text-xs" style={{ color: error ? "#ef4444" : "#22c55e" }}>
        {error ? "Error" : "Válido"}
      </span>
      {error && (
        <span
          className="max-w-[200px] truncate text-xs"
          style={{ color: "#f87171" }}
          title={error}
        >
          — {error}
        </span>
      )}
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ label, getText, disabled = false }: {
  label: string;
  getText: () => string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    void navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getText]);

  return (
    <Button
      variant="ghost" size="sm"
      onClick={handle} disabled={disabled}
      title={`Copiar ${label}`}
      className="gap-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-green-400" />
        : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

// ─── DevModePanel ─────────────────────────────────────────────────────────────

export function DevModePanel({ document, activeMailingId, onClose, onApply }: DevModePanelProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<EditorMode>("html");

  // ── JSON mode state ──────────────────────────────────────────────────────
  const initialJson = useMemo(() => JSON.stringify(document, null, 2), [document]);
  const [jsonText, setJsonText]     = useState(initialJson);
  const [jsonDirty, setJsonDirty]   = useState(false);
  const debouncedJson               = useDebounce(jsonText, 300);
  const { doc: parsedDoc, error: jsonError } = useMemo(() => tryParseDoc(debouncedJson), [debouncedJson]);

  // Auto-sync JSON → canvas cada 1 segundo
  useEffect(() => {
    if (mode !== "json" || jsonError || !jsonDirty || !parsedDoc) return;
    const id = setInterval(() => {
      onApply(parsedDoc, activeMailingId);
    }, 1000);
    return () => clearInterval(id);
  }, [mode, jsonError, jsonDirty, parsedDoc, activeMailingId, onApply]);

  // ── HTML mode state ──────────────────────────────────────────────────────
  const baseHtml                    = useMemo(() => renderMailingHtml(document), [document]);
  const [htmlText, setHtmlText]     = useState(baseHtml);
  const [htmlDirty, setHtmlDirty]   = useState(false);
  const debouncedHtml               = useDebounce(htmlText, 400);

  // Resync cuando el documento cambia externamente (aplicado desde JSON mode)
  const prevDocRef = useRef(document);
  useEffect(() => {
    if (prevDocRef.current !== document) {
      prevDocRef.current = document;
      if (!htmlDirty) setHtmlText(renderMailingHtml(document));
    }
  }, [document, htmlDirty]);

  // ── Preview ──────────────────────────────────────────────────────────────
  const [iframeKey, setIframeKey] = useState(0);
  const [darkPreview, setDarkPreview] = useState(false);
  const DARK_PREVIEW_CSS = `<style>
    html,body{background:#121212!important;color-scheme:dark}
    table,tr,td,th{background-color:#1a1a1a!important;color:#e0e0e0!important;border-color:#333!important}
    a{color:#90caf9!important}
    img{filter:brightness(.85) saturate(.9)}
    *{color:#e0e0e0!important}
  </style>`;

  const rawHtml = mode === "html" ? debouncedHtml : (parsedDoc ? renderMailingHtml(parsedDoc) : "");
  const previewHtml = darkPreview && rawHtml
    ? rawHtml.replace("</head>", `${DARK_PREVIEW_CSS}</head>`)
    : rawHtml;
  const previewError = mode === "json" ? jsonError : null;

  // ── Dirty flags ──────────────────────────────────────────────────────────
  const isDirty = mode === "json" ? jsonDirty : htmlDirty;

  const handleClose = useCallback(() => {
    if (!isDirty) { onClose(); return; }
    void Swal.fire({
      title: "¿Salir del modo desarrollador?",
      text: "Tienes cambios sin guardar. Si sales, los cambios en el editor se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Quedarme",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true, focusCancel: true,
    }).then((r) => { if (r.isConfirmed) onClose(); });
  }, [isDirty, onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const handleApplyJson = useCallback(() => {
    if (jsonError || !parsedDoc) return;
    onApply(parsedDoc, activeMailingId);
    setJsonDirty(false);
    toast({ title: "Documento actualizado", description: "Los cambios del JSON se aplicaron al canvas." });
  }, [jsonError, parsedDoc, activeMailingId, onApply, toast]);

  const handleResetHtml = useCallback(() => {
    setHtmlText(renderMailingHtml(document));
    setHtmlDirty(false);
  }, [document]);

  const sep = (
    <div className="h-5 w-px shrink-0" style={{ backgroundColor: "#3e3e42" }} />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#1e1e1e" }}
      role="dialog"
      aria-modal="true"
      aria-label="Modo desarrollador"
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "#3e3e42", backgroundColor: "#252526" }}
      >
        {/* Volver */}
        <Button
          variant="ghost" size="sm"
          onClick={handleClose}
          title="Volver al editor"
          className="gap-1.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {sep}

        {/* Badge */}
        <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ backgroundColor: "#2d1f0e" }}>
          <Code2 className="h-3.5 w-3.5" style={{ color: "#F97316" }} />
          <span className="text-xs font-semibold" style={{ color: "#F97316" }}>Modo desarrollador</span>
        </div>

        {sep}

        {/* Mode toggle */}
        <div
          className="flex rounded-md overflow-hidden"
          style={{ border: "1px solid #3e3e42" }}
          role="tablist"
          aria-label="Modo de edición"
        >
          {([
            { key: "html" as EditorMode, Icon: FileCode2, label: "HTML / SFMC" },
            { key: "json" as EditorMode, Icon: FileJson2, label: "JSON" },
          ] as const).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition"
              style={{
                backgroundColor: mode === key ? "#3e3e42" : "transparent",
                color: mode === key ? "#ffffff" : "#9d9d9d",
                outline: "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Status */}
        {mode === "json" && <StatusDot error={jsonError} />}
        {mode === "html" && (
          <span className="text-xs" style={{ color: "#9d9d9d" }}>
            AMPscript + SFMC variables disponibles
          </span>
        )}

        {sep}

        {/* Copy buttons */}
        {mode === "json" && (
          <CopyButton label="Copiar JSON" getText={() => jsonText} />
        )}
        {mode === "html" && (
          <>
            <CopyButton label="Copiar HTML" getText={() => htmlText} />
            <Button
              variant="ghost" size="sm"
              onClick={handleResetHtml}
              disabled={!htmlDirty}
              title="Restaurar HTML desde el canvas actual"
              className="gap-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restaurar
            </Button>
          </>
        )}

        {sep}

        {/* Aplicar (solo JSON mode) */}
        {mode === "json" && (
          <Button
            size="sm"
            onClick={handleApplyJson}
            disabled={!!jsonError || !jsonDirty}
            title="Aplicar JSON al canvas"
            className="gap-1.5 text-xs font-semibold"
            style={{
              backgroundColor: !jsonError && jsonDirty ? "#F97316" : undefined,
              color: !jsonError && jsonDirty ? "white" : undefined,
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Aplicar
          </Button>
        )}

        {/* Cerrar */}
        <button
          type="button"
          onClick={handleClose}
          title="Cerrar modo desarrollador"
          className="ml-1 rounded p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Split panels ──────────────────────────────────────────────────── */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">

        {/* Panel izquierdo — Editor */}
        <Panel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col" style={{ backgroundColor: "#1e1e1e" }}>
            {/* Panel header */}
            <div
              className="flex shrink-0 items-center gap-2 px-4 py-1.5 text-xs font-medium"
              style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42", color: "#9d9d9d" }}
            >
              {mode === "html" ? (
                <>
                  <FileCode2 className="h-3.5 w-3.5" />
                  HTML del email — editable para SFMC / AMPscript
                </>
              ) : (
                <>
                  <FileJson2 className="h-3.5 w-3.5" />
                  Documento JSON — estructura del mailing
                </>
              )}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              {mode === "html" ? (
                <Suspense fallback={<EditorSkeleton />}>
                  <HtmlCodeEditor
                    value={htmlText}
                    onChange={(v) => { setHtmlText(v); setHtmlDirty(true); }}
                  />
                </Suspense>
              ) : (
                <JsonTextEditor
                  value={jsonText}
                  onChange={(v) => { setJsonText(v); setJsonDirty(true); }}
                />
              )}
            </div>
          </div>
        </Panel>

        {/* Handle de resize */}
        <PanelResizeHandle
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar paneles"
          className="group relative flex w-1.5 items-center justify-center outline-none"
          style={{ backgroundColor: "#3e3e42" }}
        >
          <div
            className="absolute inset-y-0 -left-1 -right-1 z-10 flex items-center justify-center opacity-40 transition group-hover:opacity-100 group-data-[resize-handle-active]:opacity-100"
          >
            <div
              className="flex h-8 w-4 items-center justify-center rounded"
              style={{ backgroundColor: "#3e3e42" }}
            >
              <GripVertical className="h-4 w-4" style={{ color: "#858585" }} />
            </div>
          </div>
        </PanelResizeHandle>

        {/* Panel derecho — Preview */}
        <Panel defaultSize={50} minSize={25}>
          <div className="flex h-full flex-col" style={{ backgroundColor: "#1e1e1e" }}>
            <div
              className="flex shrink-0 items-center justify-between px-4 py-1.5"
              style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}
            >
              <span className="text-xs font-medium" style={{ color: "#9d9d9d" }}>
                Vista previa del email
              </span>
              <div className="flex items-center gap-1">
                {/* Dark mode toggle */}
                <button
                  type="button"
                  onClick={() => { setDarkPreview((v) => !v); setIframeKey((k) => k + 1); }}
                  title={darkPreview ? "Ver en modo claro" : "Simular modo oscuro del email"}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs transition"
                  style={{
                    backgroundColor: darkPreview ? "#3a3a4a" : "transparent",
                    color: darkPreview ? "#a78bfa" : "#9d9d9d",
                    border: darkPreview ? "1px solid #5b4fcf" : "1px solid transparent",
                  }}
                >
                  {darkPreview
                    ? <Moon className="h-3.5 w-3.5" />
                    : <Sun className="h-3.5 w-3.5" />}
                  <span>{darkPreview ? "Dark" : "Light"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  title="Recargar vista previa"
                  className="rounded p-1 text-gray-500 transition hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-white">
              {previewError ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
                  style={{ backgroundColor: "#1e1e1e" }}
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                  <p className="text-center text-sm" style={{ color: "#f87171" }}>
                    JSON inválido — corrige los errores para ver la vista previa
                  </p>
                  <p className="max-w-sm text-center text-xs" style={{ color: "#6b7280" }}>
                    {previewError}
                  </p>
                </div>
              ) : (
                <iframe
                  key={iframeKey}
                  title="Vista previa del email"
                  srcDoc={previewHtml}
                  scrolling="yes"
                  className="h-full w-full border-0"
                  style={{ display: "block", backgroundColor: "white" }}
                />
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
