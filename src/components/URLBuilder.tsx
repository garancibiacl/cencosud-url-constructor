import { useState, useEffect, useRef } from "react";
import { Copy, Check, ExternalLink, AlertCircle, ChevronsUpDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface URLParams {
  ubicacion: string;
  componente: string;
  campana: string;
  oferta: string;
  semana: string;
  fecha: string;
}

const dropdownOptions: Record<keyof URLParams, { value: string; label: string }[]> = {
  ubicacion: [
    { value: "home", label: "Home" },
    { value: "categoria", label: "Categoría" },
    { value: "producto", label: "Producto" },
    { value: "landing", label: "Landing" },
    { value: "checkout", label: "Checkout" },
    { value: "carrito", label: "Carrito" },
    { value: "buscador", label: "Buscador" },
    { value: "mi-cuenta", label: "Mi Cuenta" },
  ],
  componente: [
    { value: "banner-hero", label: "Banner Hero" },
    { value: "banner-secondary", label: "Banner Secundario" },
    { value: "banner-strip", label: "Banner Strip" },
    { value: "slider", label: "Slider / Carrusel" },
    { value: "popup", label: "Pop-up" },
    { value: "boton-cta", label: "Botón CTA" },
    { value: "card", label: "Card / Tarjeta" },
    { value: "menu", label: "Menú / Navegación" },
    { value: "footer", label: "Footer" },
    { value: "header", label: "Header" },
    { value: "modal", label: "Modal" },
    { value: "sidebar", label: "Sidebar" },
    { value: "floating", label: "Floating / Flotante" },
  ],
  campana: [
    { value: "cyber-day", label: "Cyber Day" },
    { value: "cyber-monday", label: "Cyber Monday" },
    { value: "black-friday", label: "Black Friday" },
    { value: "navidad", label: "Navidad" },
    { value: "dia-madre", label: "Día de la Madre" },
    { value: "dia-padre", label: "Día del Padre" },
    { value: "fiestas-patrias", label: "Fiestas Patrias" },
    { value: "vuelta-clases", label: "Vuelta a Clases" },
    { value: "semana-santa", label: "Semana Santa" },
    { value: "san-valentin", label: "San Valentín" },
    { value: "aniversario", label: "Aniversario" },
    { value: "liquidacion", label: "Liquidación" },
    { value: "oferta-semanal", label: "Oferta Semanal" },
    { value: "promo-especial", label: "Promo Especial" },
  ],
  oferta: [
    { value: "2x1", label: "2x1" },
    { value: "3x2", label: "3x2" },
    { value: "dcto-10", label: "10% Descuento" },
    { value: "dcto-20", label: "20% Descuento" },
    { value: "dcto-30", label: "30% Descuento" },
    { value: "dcto-40", label: "40% Descuento" },
    { value: "dcto-50", label: "50% Descuento" },
    { value: "envio-gratis", label: "Envío Gratis" },
    { value: "combo", label: "Combo / Pack" },
    { value: "cuotas-sin-interes", label: "Cuotas sin Interés" },
    { value: "regalo", label: "Regalo con Compra" },
    { value: "precio-especial", label: "Precio Especial" },
  ],
  semana: Array.from({ length: 52 }, (_, i) => ({
    value: `s${String(i + 1).padStart(2, "0")}`,
    label: `Semana ${i + 1}`,
  })),
  fecha: (() => {
    const dates: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      dates.push({
        value: `${dd}${mm}${yyyy}`,
        label: `${dd}/${mm}/${yyyy}`,
      });
    }
    return dates;
  })(),
};

const paramFields: { key: keyof URLParams; label: string; placeholder: string }[] = [
  { key: "ubicacion", label: "Ubicación", placeholder: "Seleccionar ubicación" },
  { key: "componente", label: "Componente", placeholder: "Seleccionar componente" },
  { key: "campana", label: "Campaña", placeholder: "Seleccionar campaña" },
  { key: "oferta", label: "Oferta", placeholder: "Seleccionar oferta" },
  { key: "semana", label: "Semana", placeholder: "Seleccionar semana" },
  { key: "fecha", label: "Fecha", placeholder: "Seleccionar fecha" },
];

const ComboField = ({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleCustomValue = () => {
    if (search.trim()) {
      onChange(search.trim().replace(/\s+/g, "-").toLowerCase());
      setSearch("");
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-10 w-full items-center justify-between rounded-md bg-secondary ring-1 ring-border px-3 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-ring text-left">
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {selectedLabel || value || placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar o escribir..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <button
                  onClick={handleCustomValue}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={14} />
                  Usar "{search}" como valor personalizado
                </button>
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.value);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === opt.value ? "opacity-100" : "opacity-0"}`}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !options.some((o) => o.label.toLowerCase() === search.toLowerCase()) && (
                <CommandGroup heading="Personalizado">
                  <CommandItem
                    value={`custom-${search}`}
                    onSelect={handleCustomValue}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Usar "{search}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

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

  const clearAll = () => {
    setParams({ ubicacion: "", componente: "", campana: "", oferta: "", semana: "", fecha: "" });
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                URL Base de Destino
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://www.paris.cl/busca?fq=H%3A27791"
                className="px-3 py-2 bg-secondary ring-1 ring-border focus:ring-2 focus:ring-ring rounded-md text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parámetros de Nomenclatura
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Limpiar todo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paramFields.map((field) => (
                <ComboField
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={params[field.key]}
                  onChange={(v) => updateParam(field.key, v)}
                  options={dropdownOptions[field.key]}
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
