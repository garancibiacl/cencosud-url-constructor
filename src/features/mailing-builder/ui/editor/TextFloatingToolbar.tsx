import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  Bold, ChevronUp, Code, Italic, Link2, Link2Off,
  List, ListOrdered, Minus, Plus,
  RemoveFormatting, RotateCcw, Strikethrough, Underline,
} from "lucide-react";
import { ColorPickerCanvas, hexToHsv, hsvToHex, hexToRgb, rgbToHex } from "./ColorPickerCanvas";
import { useTextCommands, saveSelection } from "./useTextCommands";
import { useFloatingPosition } from "./useFloatingPosition";

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_PALETTE = [
  { label: "Jumbo",        color: "#0A8920" },
  { label: "Santa Isabel", color: "#de0610" },
  { label: "Spid",         color: "#E91E8C" },
  { label: "Naranja",      color: "#F97316" },
  { label: "Azul",         color: "#1D4ED8" },
  { label: "Cian",         color: "#0891B2" },
  { label: "Amarillo",     color: "#CA8A04" },
  { label: "Blanco",       color: "#FFFFFF" },
  { label: "Negro",        color: "#000000" },
  { label: "Gris oscuro",  color: "#1F2937" },
  { label: "Gris medio",   color: "#6B7280" },
  { label: "Gris claro",   color: "#D1D5DB" },
];

const BLOCK_TYPES = [
  { value: "p",  label: "Párrafo" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "h3", label: "H3" },
];

const ALIGN_OPTIONS = [
  { value: "left"    as const, icon: AlignLeft,    label: "Izquierda" },
  { value: "center"  as const, icon: AlignCenter,  label: "Centro" },
  { value: "right"   as const, icon: AlignRight,   label: "Derecha" },
  { value: "justify" as const, icon: AlignJustify, label: "Justificado" },
];

const BULLET_STYLES = [
  { style: "disc",   label: "● Disco" },
  { style: "circle", label: "○ Círculo" },
  { style: "square", label: "■ Cuadrado" },
];

const ORDERED_STYLES = [
  { type: "decimal",     label: "1. Numérico" },
  { type: "lower-alpha", label: "a. Minúscula" },
  { type: "upper-alpha", label: "A. Mayúscula" },
  { type: "lower-roman", label: "i. Romano" },
  { type: "upper-roman", label: "I. Romano may." },
];

// Recent colors — shared with inspector via localStorage
const RECENT_KEY = "mailing-builder:recent-colors";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function pushRecent(color: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
  const list = readRecent().filter((c) => c.toLowerCase() !== color.toLowerCase());
  list.unshift(color);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
}

// ─── Color format utilities ───────────────────────────────────────────────────

type ColorMode = "hex" | "rgb";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const Sep = () => <div className="mx-1 h-4 w-px shrink-0 bg-white/20" />;

const btn = (active?: boolean) =>
  `flex h-7 w-7 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20${active ? " bg-white/20 text-white" : ""}`;

function useOutsideClick(ref: RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

// ─── ColorPopover ─────────────────────────────────────────────────────────────

const COLOR_POPOVER_W = 240; // matches w-60
const TOOLBAR_H = 40;       // approximate toolbar height

interface ColorPopoverProps {
  mode: "text" | "highlight";
  currentColor: string;
  anchorTop: number;
  anchorLeft: number;
  onSelect: (color: string) => void;
  onClose: () => void;
}

function ColorPopover({ mode, currentColor, anchorTop, anchorLeft, onSelect, onClose }: ColorPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Start hidden below toolbar; after first paint measure actual height and
  // flip above if there's not enough room below.
  const [top, setTop] = useState(anchorTop + TOOLBAR_H);
  const left = Math.max(8, Math.min(anchorLeft, window.innerWidth - COLOR_POPOVER_W - 8));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const belowFits = anchorTop + TOOLBAR_H + h + 8 <= window.innerHeight;
    setTop(belowFits ? anchorTop + TOOLBAR_H : Math.max(8, anchorTop - h));
  }, [anchorTop]);
  const initHex = /^#[0-9A-Fa-f]{6}$/.test(currentColor) ? currentColor : "#000000";
  const [pickerColor, setPickerColor] = useState(initHex);
  const [hsv, setHsv] = useState(() => hexToHsv(initHex));
  const [hexInput, setHexInput] = useState(initHex);
  const [colorMode, setColorMode] = useState<ColorMode>("hex");
  const [modeOpen, setModeOpen] = useState(false);
  const [rgbInput, setRgbInput] = useState(() => hexToRgb(initHex));
  const [recent, setRecent] = useState<string[]>([]);
  const initialColor = useRef(initHex);

  useEffect(() => { setRecent(readRecent()); }, []);
  useOutsideClick(ref, onClose);

  const commit = useCallback(
    (color: string) => {
      pushRecent(color);
      setRecent(readRecent());
      onSelect(color);
    },
    [onSelect],
  );

  const applyHex = useCallback((hex: string) => {
    setPickerColor(hex);
    setHsv(hexToHsv(hex));
    setHexInput(hex);
    setRgbInput(hexToRgb(hex));
    commit(hex);
  }, [commit]);

  const handleCanvasChange = useCallback((newHsv: typeof hsv) => {
    setHsv(newHsv);
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setPickerColor(hex);
    setHexInput(hex);
    setRgbInput(hexToRgb(hex));
    commit(hex);
  }, [commit]);

  const handleHexInput = useCallback((raw: string) => {
    const val = raw.startsWith("#") ? raw : `#${raw}`;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) applyHex(val);
  }, [applyHex]);

  const handleRgbChannel = useCallback(
    (channel: "r" | "g" | "b", raw: string) => {
      const n = Math.min(255, Math.max(0, parseInt(raw) || 0));
      const next = { ...rgbInput, [channel]: n };
      setRgbInput(next);
      applyHex(rgbToHex(next.r, next.g, next.b));
    },
    [rgbInput, applyHex],
  );

  return createPortal(
    <div
      ref={ref}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed", top, left, zIndex: 10000, width: COLOR_POPOVER_W,
        boxShadow: "0 4px 6px rgba(0,0,0,.3), 0 10px 40px rgba(0,0,0,.7), 0 20px 60px rgba(0,0,0,.5)",
      }}
      className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900 animate-in fade-in duration-100"
    >
      {/* Header */}
      <div className="border-b border-white/10 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
          {mode === "text" ? "Color de texto" : "Resaltado"}
        </p>
      </div>

      {/* Custom canvas: sat/bright + vertical hue */}
      <div className="px-3 pt-3 pb-2">
        <ColorPickerCanvas hsv={hsv} onChange={handleCanvasChange} height={150} />
      </div>

      {/* Input row: HEX or RGB + format selector + reset */}
      <div className="flex items-center gap-1.5 px-3 pb-3">
        {/* Color value input */}
        {colorMode === "hex" ? (
          <div className="flex flex-1 items-center rounded-md border border-white/10 bg-white/5 px-2 focus-within:border-white/30">
            <span className="font-mono text-[12px] text-zinc-500">#</span>
            <input
              type="text"
              maxLength={6}
              value={hexInput.replace(/^#/, "")}
              onChange={(e) => handleHexInput(e.target.value)}
              className="w-full bg-transparent py-1.5 pl-0.5 pr-1 font-mono text-[13px] uppercase text-zinc-200 outline-none"
              placeholder="000000"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="flex flex-1 gap-1">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="flex flex-1 flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInput[ch]}
                  onChange={(e) => handleRgbChannel(ch, e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 text-center font-mono text-[12px] text-zinc-200 outline-none focus:border-white/30 [appearance:textfield]"
                />
                <span className="text-[9px] uppercase text-zinc-600">{ch}</span>
              </div>
            ))}
          </div>
        )}

        {/* Format selector */}
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setModeOpen((v) => !v); }}
            className="flex h-8 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
          >
            {colorMode.toUpperCase()}
            <ChevronUp className={`h-3 w-3 transition-transform ${modeOpen ? "rotate-180" : ""}`} />
          </button>
          {modeOpen && (
            <div className="absolute top-full left-0 mt-1 overflow-hidden rounded-lg border border-white/10 bg-zinc-800 shadow-xl z-10">
              {(["hex", "rgb"] as ColorMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setColorMode(m); setModeOpen(false); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition hover:bg-white/10 ${colorMode === m ? "text-white" : "text-zinc-400"}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button
          type="button"
          title="Restablecer color original"
          onMouseDown={(e) => { e.preventDefault(); applyHex(initialColor.current); }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Brand palette */}
      <div className="border-t border-white/10 px-3 py-2">
        <p className="mb-2 text-[11px] font-bold text-zinc-300">
          Colores de marca
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BRAND_PALETTE.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              title={label}
              onMouseDown={(e) => {
                e.preventDefault();
                applyHex(color);
              }}
              className={`h-6 w-6 rounded-md border-2 transition-transform hover:scale-110 ${
                pickerColor.toLowerCase() === color.toLowerCase()
                  ? "border-white shadow-md"
                  : "border-transparent hover:border-white/30"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Recent colors */}
      {recent.length > 0 && (
        <div className="border-t border-white/10 px-3 py-2">
          <p className="mb-2 text-[11px] font-bold text-zinc-300">
            Usados recientemente
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyHex(c);
                }}
                className={`h-6 w-6 rounded-md border-2 transition-transform hover:scale-110 ${
                  pickerColor.toLowerCase() === c.toLowerCase()
                    ? "border-white shadow-md"
                    : "border-transparent hover:border-white/30"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

// ─── ListPopover ──────────────────────────────────────────────────────────────

interface ListPopoverProps {
  mode: "bullet" | "ordered";
  onBullet: (style: string) => void;
  onOrdered: (type: string) => void;
  onClose: () => void;
}

function ListPopover({ mode, onBullet, onOrdered, onClose }: ListPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 mt-1 w-44 rounded-lg border border-white/10 bg-zinc-900 p-2 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-1 duration-100"
      style={{ left: mode === "bullet" ? "auto" : "auto", right: 0 }}
    >
      {mode === "bullet" ? (
        <>
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Viñetas</p>
          {BULLET_STYLES.map(({ style, label }) => (
            <button
              key={style}
              type="button"
              className="flex w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/10"
              onMouseDown={(e) => { e.preventDefault(); onBullet(style); onClose(); }}
            >
              {label}
            </button>
          ))}
        </>
      ) : (
        <>
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Numeradas</p>
          {ORDERED_STYLES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="flex w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/10"
              onMouseDown={(e) => { e.preventDefault(); onOrdered(type); onClose(); }}
            >
              {label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ─── LinkPopover ──────────────────────────────────────────────────────────────

interface LinkPopoverProps {
  initial: string;
  onApply: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

function LinkPopover({ initial, onApply, onRemove, onClose }: LinkPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);

  useOutsideClick(ref, onClose);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const apply = useCallback(() => {
    onApply(value.trim());
    onClose();
  }, [value, onApply, onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-1 duration-100"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Insertar enlace</p>
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); apply(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://..."
          className="flex-1 rounded-md bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/30"
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); apply(); }}
          className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
        >
          OK
        </button>
      </div>
      {initial && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onRemove(); onClose(); }}
          className="mt-2 flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
        >
          <Link2Off className="h-3 w-3" />
          Eliminar enlace
        </button>
      )}
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

type PopoverKind = null | "text-color" | "highlight" | "bullet" | "ordered" | "link";

export function TextFloatingToolbar({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const {
    rect, hasSelection, fmt,
    exec, applyFontSize, applyColor, applyHighlight,
    applyAlignment, applyHeading, applyBulletList, applyOrderedList,
    applyLink, removeLink,
  } = useTextCommands(containerRef);

  const pos = useFloatingPosition(rect);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [fontSizeVal, setFontSizeVal] = useState(fmt.fontSize);
  const [linkInitial, setLinkInitial] = useState("");

  useEffect(() => { setFontSizeVal(fmt.fontSize); }, [fmt.fontSize]);
  useEffect(() => { if (!hasSelection) setPopover(null); }, [hasSelection]);

  const openPopover = useCallback((kind: PopoverKind, extra?: string) => {
    saveSelection();
    if (extra !== undefined) setLinkInitial(extra);
    setPopover((prev) => (prev === kind ? null : kind));
  }, []);

  const closePopover = useCallback(() => setPopover(null), []);

  if (!hasSelection || !pos.visible) return null;

  const fsNum = Math.max(8, parseInt(fontSizeVal) || 16);

  const getCurrentLinkHref = () => {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    return (el?.closest("a") as HTMLAnchorElement | null)?.href ?? "";
  };

  const wrapCode = () => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const text = sel.getRangeAt(0).toString();
    exec("insertHTML", `<code style="font-family:monospace;background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:3px">${text}</code>`);
  };

  return createPortal(
    <div
      style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Toolbar row ─────────────────────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label="Formato de texto"
        className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-zinc-900 px-1.5 py-1 shadow-xl shadow-black/40 animate-in fade-in slide-in-from-bottom-1 duration-150"
      >
        {/* Block type */}
        <select
          value={fmt.blockType}
          onMouseDown={() => saveSelection()}
          onChange={(e) => applyHeading(e.target.value)}
          className="h-7 cursor-pointer rounded bg-white/5 px-1.5 text-[11px] text-zinc-300 outline-none hover:bg-white/10"
        >
          {BLOCK_TYPES.map(({ value, label }) => (
            <option key={value} value={value} className="bg-zinc-900">
              {label}
            </option>
          ))}
        </select>

        <Sep />

        {/* Font size stepper */}
        <button
          type="button"
          title="Reducir tamaño"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); applyFontSize(Math.max(8, fsNum - 1)); }}
          className={btn()}
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          value={fontSizeVal}
          min={8}
          max={96}
          onMouseDown={() => saveSelection()}
          onChange={(e) => setFontSizeVal(e.target.value)}
          onBlur={() => applyFontSize(fsNum)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyFontSize(fsNum); } }}
          className="h-7 w-9 rounded bg-white/5 text-center text-[11px] text-zinc-300 outline-none focus:bg-white/10 [appearance:textfield]"
        />
        <button
          type="button"
          title="Aumentar tamaño"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); applyFontSize(Math.min(96, fsNum + 1)); }}
          className={btn()}
        >
          <Plus className="h-3 w-3" />
        </button>

        <Sep />

        {/* Inline format buttons */}
        <button type="button" title="Negrita (⌘B)"       onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}          className={btn(fmt.bold)}>          <Bold          className="h-3.5 w-3.5" /></button>
        <button type="button" title="Cursiva (⌘I)"       onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}        className={btn(fmt.italic)}>        <Italic        className="h-3.5 w-3.5" /></button>
        <button type="button" title="Subrayado (⌘U)"     onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}     className={btn(fmt.underline)}>     <Underline     className="h-3.5 w-3.5" /></button>
        <button type="button" title="Tachado"             onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }} className={btn(fmt.strikeThrough)}> <Strikethrough className="h-3.5 w-3.5" /></button>
        <button type="button" title="Código inline"       onMouseDown={(e) => { e.preventDefault(); wrapCode(); }}            className={btn()}>                  <Code          className="h-3.5 w-3.5" /></button>

        <Sep />

        {/* Text color */}
        <button
          type="button"
          title="Color de texto"
          onMouseDown={(e) => { e.preventDefault(); openPopover("text-color"); }}
          className={btn(popover === "text-color")}
        >
          <div className="flex flex-col items-center gap-[3px]">
            <span className="text-[11px] font-bold leading-none">A</span>
            <div className="h-[3px] w-3.5 rounded-full" style={{ backgroundColor: fmt.textColor }} />
          </div>
        </button>

        {/* Highlight */}
        <button
          type="button"
          title="Resaltado"
          onMouseDown={(e) => { e.preventDefault(); openPopover("highlight"); }}
          className={btn(popover === "highlight")}
        >
          <div className="flex flex-col items-center gap-[3px]">
            <span className="text-[10px] leading-none">M</span>
            <div className="h-[3px] w-3.5 rounded-full bg-yellow-400" />
          </div>
        </button>

        <Sep />

        {/* Alignment */}
        {ALIGN_OPTIONS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            title={label}
            onMouseDown={(e) => { e.preventDefault(); applyAlignment(value); }}
            className={btn(fmt.alignment === value)}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}

        <Sep />

        {/* Bullet list */}
        <button
          type="button"
          title="Lista de viñetas"
          onMouseDown={(e) => { e.preventDefault(); openPopover("bullet"); }}
          className={btn(popover === "bullet")}
        >
          <List className="h-3.5 w-3.5" />
        </button>

        {/* Ordered list */}
        <button
          type="button"
          title="Lista numerada"
          onMouseDown={(e) => { e.preventDefault(); openPopover("ordered"); }}
          className={btn(popover === "ordered")}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <Sep />

        {/* Link */}
        <button
          type="button"
          title="Insertar enlace"
          onMouseDown={(e) => { e.preventDefault(); openPopover("link", getCurrentLinkHref()); }}
          className={btn(popover === "link")}
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>

        {/* Remove format */}
        <button
          type="button"
          title="Eliminar formato"
          onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}
          className={btn()}
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Popovers ─────────────────────────────────────────────────────────── */}

      {(popover === "text-color" || popover === "highlight") && (
        <ColorPopover
          mode={popover === "text-color" ? "text" : "highlight"}
          currentColor={fmt.textColor}
          anchorTop={pos.top}
          anchorLeft={pos.left}
          onSelect={popover === "text-color" ? applyColor : applyHighlight}
          onClose={closePopover}
        />
      )}

      {(popover === "bullet" || popover === "ordered") && (
        <ListPopover
          mode={popover}
          onBullet={(style) => applyBulletList(style)}
          onOrdered={(type) => applyOrderedList(type)}
          onClose={closePopover}
        />
      )}

      {popover === "link" && (
        <LinkPopover
          initial={linkInitial}
          onApply={applyLink}
          onRemove={removeLink}
          onClose={closePopover}
        />
      )}
    </div>,
    document.body,
  );
}
