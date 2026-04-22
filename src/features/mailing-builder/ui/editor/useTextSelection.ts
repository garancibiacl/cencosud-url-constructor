import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface TextSelectionState {
  rect: DOMRect | null;
  hasSelection: boolean;
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>): TextSelectionState {
  const [state, setState] = useState<TextSelectionState>({ rect: null, hasSelection: false });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.toString().length) {
      setState({ rect: null, hasSelection: false });
      return;
    }

    const range = sel.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setState({ rect: null, hasSelection: false });
      return;
    }

    const rect = range.getBoundingClientRect();
    setState({ rect, hasSelection: true });
  }, [containerRef]);

  useEffect(() => {
    const handler = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(update, 100);
    };
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
      clearTimeout(timerRef.current);
    };
  }, [update]);

  return state;
}
