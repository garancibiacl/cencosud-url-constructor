import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ArrowLeft, Check, Code2, Copy, GripVertical, RefreshCw, X } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { renderMailingHtml } from "../logic/exporters/renderMailingHtml";
import type { MailingDocument } from "../logic/schema/mailing.types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface DevModePanelProps {
  document: MailingDocument;
  activeMailingId: string | null;
  onClose: () => void;
  onApply: (doc: MailingDocument, mailingId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countLines(text: string): number {
  return text.split("\n").length;
}

// ---------------------------------------------------------------------------
// LineNumbers — columna izquierda fija con números de línea
// ---------------------------------------------------------------------------

function LineNumbers({ count, scrollTop }: { count: number; scrollTop: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 48,
        paddingTop: 16,
        paddingBottom: 16,
        userSelect: "none",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: 13,
        lineHeight: "1.6",
        color: "#858585",
        textAlign: "right",
        backgroundColor: "#1e1e1e",
        borderRight: "1px solid #3e3e42",
        overflow: "hidden",
        transform: `translateY(${-scrollTop}px)`,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ paddingRight: 8, paddingLeft: 8 }}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DevModePanel
// ---------------------------------------------------------------------------

export function DevModePanel({ document, activeMailingId, onClose, onApply }: DevModePanelProps) {
  const { toast } = useToast();

  const initialJson = useMemo(() => JSON.stringify(document, null, 2), [document]);

  const [jsonText, setJsonText] = useState(initialJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<MailingDocument>(document);
  const [isDirty, setIsDirty] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [copyJsonLabel, setCopyJsonLabel] = useState<"copy" | "copied">("copy");
  const [copyHtmlLabel, setCopyHtmlLabel] = useState<"copy" | "copied">("copy");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lineCount = useMemo(() => countLines(jsonText), [jsonText]);

  const renderedHtml = useMemo(() => {
    if (parseError) return "";
    try {
      return renderMailingHtml(parsedDoc);
    } catch {
      return "";
    }
  }, [parsedDoc, parseError]);

  // Auto-sync válido cada 1 segundo
  useEffect(() => {
    autoSyncRef.current = setInterval(() => {
      if (!parseError && isDirty) {
        onApply(parsedDoc, activeMailingId);
      }
    }, 1000);
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current);
    };
  }, [parseError, isDirty, parsedDoc, activeMailingId, onApply]);

  // Escape key → cerrar con confirmación si hay cambios
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonText(value);
    setIsDirty(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(value) as MailingDocument;
        setParsedDoc(parsed);
        setParseError(null);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "JSON inválido");
      }
    }, 300);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop((e.target as HTMLTextAreaElement).scrollTop);
  }, []);

  const handleApply = useCallback(() => {
    if (parseError) return;
    onApply(parsedDoc, activeMailingId);
    setIsDirty(false);
    toast({ title: "Cambios aplicados", description: "El documento fue actualizado correctamente." });
  }, [parseError, parsedDoc, activeMailingId, onApply, toast]);

  const handleClose = useCallback(() => {
    if (!isDirty) {
      onClose();
      return;
    }
    void Swal.fire({
      title: "¿Descartar cambios?",
      text: "Tienes cambios sin aplicar. Si cierras el modo desarrollador, se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, descartar",
      cancelButtonText: "Mantener",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onClose();
      }
    });
  }, [isDirty, onClose]);

  const handleCopyJson = useCallback(() => {
    void navigator.clipboard.writeText(jsonText).then(() => {
      setCopyJsonLabel("copied");
      setTimeout(() => setCopyJsonLabel("copy"), 2000);
    });
  }, [jsonText]);

  const handleCopyHtml = useCallback(() => {
    void navigator.clipboard.writeText(renderedHtml).then(() => {
      setCopyHtmlLabel("copied");
      setTimeout(() => setCopyHtmlLabel("copy"), 2000);
    });
  }, [renderedHtml]);

  const handleReloadIframe = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#1e1e1e" }}
      role="dialog"
      aria-modal="true"
      aria-label="Modo desarrollador"
    >
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-3 border-b px-4 py-2"
        style={{ borderColor: "#3e3e42", backgroundColor: "#252526" }}
      >
        {/* Volver */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          title="Volver al editor"
          className="gap-1.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al editor
        </Button>

        <div className="h-5 w-px" style={{ backgroundColor: "#3e3e42" }} />

        {/* Badge modo desarrollador */}
        <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ backgroundColor: "#2d1f0e" }}>
          <Code2 className="h-3.5 w-3.5" style={{ color: "#F97316" }} />
          <span className="text-xs font-semibold" style={{ color: "#F97316" }}>
            Modo desarrollador
          </span>
        </div>

        <div className="flex-1" />

        {/* Estado JSON */}
        <div className="flex items-center gap-1.5" title={parseError ?? "JSON válido"}>
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: parseError ? "#ef4444" : "#22c55e" }}
          />
          <span className="text-xs" style={{ color: parseError ? "#ef4444" : "#22c55e" }}>
            {parseError ? "JSON inválido" : "JSON válido"}
          </span>
          {parseError && (
            <span
              className="max-w-[240px] truncate text-xs"
              style={{ color: "#f87171" }}
              title={parseError}
            >
              — {parseError}
            </span>
          )}
        </div>

        <div className="h-5 w-px" style={{ backgroundColor: "#3e3e42" }} />

        {/* Copiar JSON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyJson}
          title="Copiar JSON al portapapeles"
          className="gap-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
        >
          {copyJsonLabel === "copied" ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copiar JSON
        </Button>

        {/* Copiar HTML */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyHtml}
          title="Copiar HTML renderizado al portapapeles"
          className="gap-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
          disabled={!!parseError}
        >
          {copyHtmlLabel === "copied" ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copiar HTML
        </Button>

        <div className="h-5 w-px" style={{ backgroundColor: "#3e3e42" }} />

        {/* Aplicar cambios */}
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!!parseError || !isDirty}
          title="Aplicar cambios al documento"
          className="gap-1.5 text-xs font-semibold"
          style={{ backgroundColor: parseError || !isDirty ? undefined : "#F97316", color: parseError || !isDirty ? undefined : "white" }}
        >
          <Check className="h-3.5 w-3.5" />
          Aplicar cambios
        </Button>

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

      {/* ── Split panels ───────────────────────────────────────────────────── */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Panel izquierdo — Editor JSON */}
        <Panel defaultSize={50} minSize={25}>
          <div className="relative flex h-full flex-col" style={{ backgroundColor: "#1e1e1e" }}>
            {/* Header del panel */}
            <div
              className="flex shrink-0 items-center px-4 py-1.5 text-xs font-medium"
              style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42", color: "#9d9d9d" }}
            >
              JSON del documento
            </div>

            {/* Editor con números de línea */}
            <div className="relative flex-1 overflow-hidden">
              <LineNumbers count={lineCount} scrollTop={scrollTop} />
              <textarea
                ref={textareaRef}
                value={jsonText}
                onChange={handleTextChange}
                onScroll={handleScroll}
                aria-label="Editor JSON del documento"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                className="absolute inset-0 h-full w-full resize-none border-0 outline-none"
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  fontSize: 13,
                  lineHeight: "1.6",
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                  padding: "16px 16px 16px 64px",
                  caretColor: "#d4d4d4",
                  tabSize: 2,
                }}
              />
            </div>
          </div>
        </Panel>

        {/* Handle de resize */}
        <PanelResizeHandle
          role="separator"
          aria-orientation="vertical"
          className="group relative flex w-1.5 items-center justify-center outline-none"
          style={{ backgroundColor: "#3e3e42" }}
        >
          <div
            className="absolute inset-y-0 -left-1 -right-1 z-10 flex items-center justify-center transition group-hover:opacity-100 group-data-[resize-handle-active]:opacity-100"
            style={{ opacity: 0.4 }}
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
            {/* Header del panel preview */}
            <div
              className="flex shrink-0 items-center justify-between px-4 py-1.5"
              style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}
            >
              <span className="text-xs font-medium" style={{ color: "#9d9d9d" }}>
                Vista previa del email
              </span>
              <button
                type="button"
                onClick={handleReloadIframe}
                title="Recargar vista previa"
                className="rounded p-1 transition"
                style={{ color: "#9d9d9d" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9d9d9d"; }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* iframe o overlay de error */}
            <div className="relative flex-1 overflow-hidden bg-white">
              {parseError ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ backgroundColor: "#1e1e1e" }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <p className="text-sm" style={{ color: "#f87171" }}>
                    JSON inválido — corrige los errores para ver la vista previa
                  </p>
                  <p
                    className="max-w-sm text-center text-xs"
                    style={{ color: "#6b7280" }}
                  >
                    {parseError}
                  </p>
                </div>
              ) : (
                <iframe
                  key={iframeKey}
                  title="Vista previa del email"
                  srcDoc={renderedHtml}
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
