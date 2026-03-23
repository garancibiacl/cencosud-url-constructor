/**
 * AISettingsModal.tsx
 *
 * Modal for managing the OpenAI API Key.
 * - Reads the real key from localStorage and puts it directly in the input
 * - type="password" handles the visual masking natively — no fake "••••" tricks
 * - Guardar persists to localStorage; Eliminar removes it
 */

import { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { getStoredAPIKey, storeAPIKey, clearAPIKey } from "../services/openaiImageEditService";

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
  onKeyChange?: (hasKey: boolean) => void;
}

export function AISettingsModal({ open, onClose, onKeyChange }: AISettingsModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey,  setShowKey]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  // Every time the modal opens, read the real key from localStorage
  useEffect(() => {
    if (!open) return;
    setKeyInput(getStoredAPIKey());
    setSaved(false);
    setShowKey(false);
  }, [open]);

  const hasKey = keyInput.trim().length > 0;

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    storeAPIKey(trimmed);
    setSaved(true);
    onKeyChange?.(true);
    setTimeout(onClose, 700);
  };

  const handleClear = () => {
    clearAPIKey();
    setKeyInput("");
    setSaved(false);
    onKeyChange?.(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-violet-200 bg-white shadow-2xl p-6">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <KeyRound size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Configuración IA</h2>
            <p className="text-xs text-muted-foreground">OpenAI API Key para Relleno Generativo</p>
          </div>
        </div>

        {/* Status banner */}
        <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
          hasKey
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-amber-50 border border-amber-200 text-amber-800"
        }`}>
          {hasKey
            ? <><CheckCircle2 size={13} /> API Key configurada y activa</>
            : <><AlertTriangle size={13} /> Sin API Key — las expansiones no funcionarán</>}
        </div>

        {/* Privacy note */}
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Tu clave se guarda <strong>únicamente en este navegador</strong> (localStorage) y nunca
          se envía a ningún servidor de Cencosud. Obtén una en{" "}
          <span className="font-mono font-semibold text-foreground">platform.openai.com → API Keys</span>.
        </p>

        {/* Input */}
        <div className="relative mb-4">
          <Input
            type={showKey ? "text" : "password"}
            placeholder="sk-proj-..."
            value={keyInput}
            onChange={(e) => { setKeyInput(e.target.value); setSaved(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            className="pr-10 font-mono text-sm border-violet-300 focus-visible:ring-violet-400"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowKey((v) => !v)}
            tabIndex={-1}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={!hasKey}
          >
            {saved
              ? <><CheckCircle2 size={14} className="mr-1.5" /> Guardada</>
              : "Guardar Key"}
          </Button>
          {getStoredAPIKey() && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleClear}
            >
              Eliminar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground text-center">
          Cada expansión consume aprox. <strong>$0.016 USD</strong> en tu cuenta de OpenAI (DALL-E 2, 1024×1024).
        </p>
      </div>
    </div>
  );
}
