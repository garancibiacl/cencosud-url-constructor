import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface URLParams {
  ubicacion: string;
  componente: string;
  campana: string;
  oferta: string;
  semana: string;
  fecha: string;
}

const paramFields: { key: keyof URLParams; label: string; placeholder: string }[] = [
  { key: "ubicacion", label: "Ubicación", placeholder: "home" },
  { key: "componente", label: "Componente", placeholder: "banner" },
  { key: "campana", label: "Campaña", placeholder: "especial-semana-santa" },
  { key: "oferta", label: "Oferta", placeholder: "salmon-filete-kg" },
  { key: "semana", label: "Semana", placeholder: "s12" },
  { key: "fecha", label: "Fecha", placeholder: "20032026" },
];

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\s+/g, "-"))}
      placeholder={placeholder}
      className="px-3 py-2 bg-secondary ring-1 ring-border focus:ring-2 focus:ring-ring rounded-md text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground"
    />
  </div>
);

const URLBuilder = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [params, setParams] = useState<URLParams>({
    ubicacion: "",
    componente: "",
    campana: "",
    oferta: "",
    semana: "",
    fecha: "",
  });
  const [finalUrl, setFinalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const promoName = [
      params.ubicacion,
      params.componente,
      params.campana,
      params.oferta,
      params.semana,
      params.fecha,
    ]
      .filter(Boolean)
      .join("-");

    if (!baseUrl) {
      setFinalUrl("");
      return;
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    setFinalUrl(promoName ? `${baseUrl}${separator}nombre_promo=${promoName}` : baseUrl);
  }, [baseUrl, params]);

  const copyToClipboard = () => {
    if (!finalUrl) return;
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateParam = (key: keyof URLParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-5xl mx-auto w-full overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Constructor de URLs</h1>
        <p className="text-muted-foreground">
          Ecosistema Cencosud • Guía Maestra de Nomenclatura
        </p>
      </header>

      <div className="grid gap-8">
        {/* Form Card */}
        <div className="bg-card shadow-card rounded-xl p-6">
          <div className="space-y-6">
            <InputField
              label="URL Base de Destino"
              placeholder="https://www.paris.cl/busca?fq=H%3A27791"
              value={baseUrl}
              onChange={setBaseUrl}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
              {paramFields.map((field) => (
                <InputField
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={params[field.key]}
                  onChange={(v) => updateParam(field.key, v)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Live Preview
          </h3>
          <div className="bg-primary rounded-xl shadow-elevated overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="p-2 bg-primary-foreground/10 rounded-lg">
                  <ExternalLink size={20} className="text-primary-foreground" />
                </div>
                <button
                  onClick={copyToClipboard}
                  disabled={!finalUrl}
                  className="flex items-center gap-2 bg-accent hover:brightness-95 text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copiado" : "Copiar Link Completo"}
                </button>
              </div>

              <div className="bg-foreground/20 rounded-lg p-4 min-h-[80px] break-all">
                <code className="text-primary-foreground/90 font-mono text-sm leading-relaxed tabular-nums">
                  {finalUrl || "Esperando parámetros..."}
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Warning */}
        {!baseUrl && (
          <div className="flex items-center gap-2 text-warning-foreground text-sm bg-warning-bg p-4 rounded-lg border border-warning-border">
            <AlertCircle size={16} className="shrink-0" />
            <span>Ingresa una URL base para comenzar a generar la nomenclatura.</span>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-8 right-8 bg-foreground text-background px-6 py-3 rounded-xl shadow-elevated flex items-center gap-3 z-50"
          >
            <Check size={18} className="text-accent" />
            <span className="font-medium">URL copiada al portapapeles</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default URLBuilder;
