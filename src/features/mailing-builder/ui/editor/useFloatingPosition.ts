import { useCallback, useEffect, useState } from "react";

const TOOLBAR_HEIGHT = 44;
const TOOLBAR_WIDTH = 560;
const GAP = 8;

interface FloatingPosition {
  top: number;
  left: number;
  visible: boolean;
}

export function useFloatingPosition(rect: DOMRect | null): FloatingPosition {
  const [pos, setPos] = useState<FloatingPosition>({ top: 0, left: 0, visible: false });

  const calculate = useCallback(() => {
    if (!rect) {
      setPos((p) => ({ ...p, visible: false }));
      return;
    }

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const vw = window.innerWidth;

    // Centrado horizontal sobre la selección, -40px encima
    let top = rect.top + scrollY - TOOLBAR_HEIGHT - GAP;
    let left = rect.left + scrollX + rect.width / 2 - TOOLBAR_WIDTH / 2;

    // Clamp horizontal
    left = Math.max(GAP + scrollX, Math.min(left, vw + scrollX - TOOLBAR_WIDTH - GAP));

    // Si no cabe arriba, flip debajo
    if (rect.top < TOOLBAR_HEIGHT + GAP * 2) {
      top = rect.bottom + scrollY + GAP;
    }

    setPos({ top, left, visible: true });
  }, [rect]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  useEffect(() => {
    const opts = { passive: true } as const;
    window.addEventListener("scroll", calculate, opts);
    window.addEventListener("resize", calculate, opts);
    return () => {
      window.removeEventListener("scroll", calculate);
      window.removeEventListener("resize", calculate);
    };
  }, [calculate]);

  return pos;
}
