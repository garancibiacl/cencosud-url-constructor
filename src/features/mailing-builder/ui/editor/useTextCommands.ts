import { useCallback, useEffect, useState, type RefObject } from "react";
import { useTextSelection } from "./useTextSelection";

// ---------------------------------------------------------------------------
// Selection persistence (module-level — survives re-renders)
// ---------------------------------------------------------------------------

let _saved: Range | null = null;

export function saveSelection(): void {
  const sel = window.getSelection();
  if (sel?.rangeCount) _saved = sel.getRangeAt(0).cloneRange();
}

/** Focuses containerEl (if provided) then restores the last saved range. */
export function restoreSelection(containerEl?: HTMLElement | null): void {
  if (containerEl) containerEl.focus({ preventScroll: true });
  if (!_saved) return;
  const sel = window.getSelection();
  try {
    sel?.removeAllRanges();
    sel?.addRange(_saved);
  } catch {
    // Range may be stale after DOM mutations
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  blockType: string;
  fontName: string;
  fontSize: string;
  textColor: string;
  alignment: "left" | "center" | "right" | "justify";
}

export interface UseTextCommandsResult {
  rect: DOMRect | null;
  hasSelection: boolean;
  fmt: TextFormatState;
  /** Direct execCommand — call from toolbar button onMouseDown (selection preserved via e.preventDefault). */
  exec: (command: string, value?: string) => void;
  applyFontSize: (px: number) => void;
  applyFontFamily: (font: string) => void;
  applyColor: (color: string) => void;
  applyHighlight: (color: string) => void;
  applyAlignment: (align: "left" | "center" | "right" | "justify") => void;
  applyHeading: (tag: string) => void;
  applyBulletList: (style?: string) => void;
  applyOrderedList: (type?: string) => void;
  applyLink: (url: string) => void;
  removeLink: () => void;
  indent: (dir: "in" | "out") => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const INITIAL: TextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  blockType: "p",
  fontName: "",
  fontSize: "16",
  textColor: "#000000",
  alignment: "left",
};

function rgbToHex(rgb: string): string {
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "#000000";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

function getAlignment(): "left" | "center" | "right" | "justify" {
  if (document.queryCommandState("justifyCenter")) return "center";
  if (document.queryCommandState("justifyRight")) return "right";
  if (document.queryCommandState("justifyFull")) return "justify";
  return "left";
}

function readFormatState(): TextFormatState {
  try {
    const sel = window.getSelection();
    const node = sel?.focusNode;
    const el = node instanceof Element ? node : (node?.parentElement ?? null);
    const computed = el ? window.getComputedStyle(el) : null;
    const pxRaw = computed ? parseFloat(computed.fontSize) : NaN;
    const fontSize = isNaN(pxRaw) ? "16" : String(Math.round(pxRaw));
    const textColor = computed ? rgbToHex(computed.color) : "#000000";
    return {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      blockType: document.queryCommandValue("formatBlock").toLowerCase() || "p",
      fontName: document.queryCommandValue("fontName"),
      fontSize,
      textColor,
      alignment: getAlignment(),
    };
  } catch {
    return INITIAL;
  }
}

function css(command: string, value?: string) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(command, false, value);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTextCommands(containerRef: RefObject<HTMLElement | null>): UseTextCommandsResult {
  const { rect, hasSelection } = useTextSelection(containerRef);
  const [fmt, setFmt] = useState<TextFormatState>(INITIAL);

  // Refresh format state whenever selection changes
  useEffect(() => {
    if (hasSelection) setFmt(readFormatState());
  }, [hasSelection, rect]);

  // ── Direct toolbar-button commands (selection preserved by e.preventDefault) ──

  const exec = useCallback((command: string, value?: string) => {
    css(command, value);
    setFmt(readFormatState());
  }, []);

  const indent = useCallback((dir: "in" | "out") => {
    document.execCommand(dir === "in" ? "indent" : "outdent", false);
  }, []);

  // ── Popover-triggered commands (need restoreSelection first) ──

  const applyFontSize = useCallback(
    (px: number) => {
      restoreSelection(containerRef.current);
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      if (range.collapsed) return;

      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;

      try {
        range.surroundContents(span);
      } catch {
        // Selection crosses element boundaries — extract and re-wrap
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }

      // Notify the contenteditable onChange handler with the correct HTML
      containerRef.current?.dispatchEvent(new InputEvent("input", { bubbles: true }));

      // Re-select the new span so consecutive stepper clicks keep working
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveSelection();

      setFmt((s) => ({ ...s, fontSize: String(px) }));
    },
    [containerRef],
  );

  const applyFontFamily = useCallback(
    (font: string) => {
      restoreSelection(containerRef.current);
      css("fontName", font);
      setFmt((s) => ({ ...s, fontName: font }));
    },
    [containerRef],
  );

  const applyColor = useCallback(
    (color: string) => {
      restoreSelection(containerRef.current);
      css("foreColor", color);
      setFmt((s) => ({ ...s, textColor: color }));
    },
    [containerRef],
  );

  const applyHighlight = useCallback(
    (color: string) => {
      restoreSelection(containerRef.current);
      css("hiliteColor", color);
    },
    [containerRef],
  );

  const applyAlignment = useCallback(
    (align: "left" | "center" | "right" | "justify") => {
      restoreSelection(containerRef.current);
      const map = {
        left: "justifyLeft",
        center: "justifyCenter",
        right: "justifyRight",
        justify: "justifyFull",
      } as const;
      document.execCommand(map[align], false);
      setFmt((s) => ({ ...s, alignment: align }));
    },
    [containerRef],
  );

  const applyHeading = useCallback(
    (tag: string) => {
      restoreSelection(containerRef.current);
      document.execCommand("formatBlock", false, tag);
      setFmt((s) => ({ ...s, blockType: tag }));
    },
    [containerRef],
  );

  const applyBulletList = useCallback(
    (style?: string) => {
      restoreSelection(containerRef.current);
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const existingUl = (node instanceof Element ? node : node?.parentElement)?.closest("ul");

      if (!existingUl || style) {
        if (!existingUl) document.execCommand("insertUnorderedList", false);
        // Locate the ul after potential creation
        const afterNode = window.getSelection()?.anchorNode;
        const ul = (afterNode instanceof Element ? afterNode : afterNode?.parentElement)?.closest("ul");
        if (ul && style) ul.style.listStyleType = style;
      } else {
        // Toggle off
        document.execCommand("insertUnorderedList", false);
      }
      setFmt(readFormatState());
    },
    [containerRef],
  );

  const applyOrderedList = useCallback(
    (type?: string) => {
      restoreSelection(containerRef.current);
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const existingOl = (node instanceof Element ? node : node?.parentElement)?.closest("ol");

      if (!existingOl || type) {
        if (!existingOl) document.execCommand("insertOrderedList", false);
        const afterNode = window.getSelection()?.anchorNode;
        const ol = (afterNode instanceof Element ? afterNode : afterNode?.parentElement)?.closest("ol");
        if (ol && type) ol.style.listStyleType = type;
      } else {
        document.execCommand("insertOrderedList", false);
      }
      setFmt(readFormatState());
    },
    [containerRef],
  );

  const applyLink = useCallback(
    (url: string) => {
      restoreSelection(containerRef.current);
      if (url.trim()) {
        document.execCommand("createLink", false, url.trim());
      } else {
        document.execCommand("unlink", false);
      }
    },
    [containerRef],
  );

  const removeLink = useCallback(
    () => {
      restoreSelection(containerRef.current);
      document.execCommand("unlink", false);
    },
    [containerRef],
  );

  return {
    rect,
    hasSelection,
    fmt,
    exec,
    applyFontSize,
    applyFontFamily,
    applyColor,
    applyHighlight,
    applyAlignment,
    applyHeading,
    applyBulletList,
    applyOrderedList,
    applyLink,
    removeLink,
    indent,
  };
}
