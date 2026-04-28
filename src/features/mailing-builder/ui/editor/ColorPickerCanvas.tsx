import { useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Color utilities — exported so callers can share them
// ─────────────────────────────────────────────────────────────────────────────

export interface Hsv { h: number; s: number; v: number }

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function hexToHsv(hex: string): Hsv {
  const { r, g, b } = hexToRgb(hex);
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rr)      h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else                 h = (rr - gg) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: Math.round(max === 0 ? 0 : (d / max) * 100), v: Math.round(max * 100) };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const ss = s / 100, vv = v / 100;
  const c = vv * ss, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = vv - c;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useDrag — stable onMouseDown, always calls the latest callback via ref
// ─────────────────────────────────────────────────────────────────────────────

function useDrag(onMove: (clientX: number, clientY: number, rect: DOMRect) => void) {
  const cbRef = useRef(onMove);
  cbRef.current = onMove; // update every render — safe: only read inside events

  const elRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    cbRef.current(e.clientX, e.clientY, rect);
    const move = (ev: MouseEvent) => cbRef.current(ev.clientX, ev.clientY, rect);
    const up   = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup",   up);
  }, []);

  return { ref: elRef, onMouseDown };
}

// ─────────────────────────────────────────────────────────────────────────────
// ColorPickerCanvas — sat/bright canvas LEFT + vertical hue slider RIGHT
// ─────────────────────────────────────────────────────────────────────────────

export interface ColorPickerCanvasProps {
  hsv: Hsv;
  onChange: (hsv: Hsv) => void;
  height?: number;
}

function sat(n: number) { return Math.max(0, Math.min(1, n)); }

export function ColorPickerCanvas({ hsv, onChange, height = 160 }: ColorPickerCanvasProps) {
  const handleSatVal = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    onChange({
      ...hsv,
      s: Math.round(sat((clientX - rect.left) / rect.width) * 100),
      v: Math.round((1 - sat((clientY - rect.top) / rect.height)) * 100),
    });
  }, [hsv, onChange]);

  const handleHue = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    onChange({ ...hsv, h: Math.round(sat((clientY - rect.top) / rect.height) * 360) });
  }, [hsv, onChange]);

  const { ref: satRef, onMouseDown: satDown } = useDrag(handleSatVal);
  const { ref: hueRef, onMouseDown: hueDown } = useDrag(handleHue);

  const pLeft = hsv.s;           // 0–100 %
  const pTop  = 100 - hsv.v;    // 0–100 %
  const hTop  = (hsv.h / 360) * 100;
  const hueColor = `hsl(${hsv.h},100%,50%)`;

  return (
    <div style={{ display: "flex", gap: 8, height }}>
      {/* ── Saturation / brightness canvas ── */}
      <div
        ref={satRef}
        onMouseDown={satDown}
        style={{
          flex: 1,
          height: "100%",
          borderRadius: 8,
          backgroundImage: [
            "linear-gradient(to bottom, transparent, #000)",
            `linear-gradient(to right, #fff, ${hueColor})`,
          ].join(", "),
          position: "relative",
          cursor: "crosshair",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${pLeft}%`,
            top:  `${pTop}%`,
            transform: "translate(-50%, -50%)",
            width: 14, height: 14,
            borderRadius: "50%",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,.25), 0 2px 6px rgba(0,0,0,.4)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Vertical hue slider ── */}
      <div
        ref={hueRef}
        onMouseDown={hueDown}
        style={{
          width: 14,
          height: "100%",
          borderRadius: 8,
          background:
            "linear-gradient(to bottom,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)",
          position: "relative",
          cursor: "ns-resize",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${hTop}%`,
            transform: "translate(-50%, -50%)",
            width: 18, height: 18,
            borderRadius: "50%",
            border: "3px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,.25), 0 2px 6px rgba(0,0,0,.4)",
            backgroundColor: hueColor,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
