/**
 * Horizontal drop indicator rendered between rows during drag-over.
 * Uses negative vertical margin so it doesn't add visual spacing to the row list.
 */
export function BlockDropIndicator() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative z-20 -my-[3px] flex items-center px-0.5"
    >
      <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-violet-500 ring-2 ring-card" />
      <span
        className="h-[2px] flex-1 rounded-full"
        style={{
          background: "linear-gradient(90deg, #7C3AED 0%, #a78bfa 100%)",
          boxShadow: "0 0 6px 2px rgba(124,58,237,0.4)",
        }}
      />
      <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-violet-500 ring-2 ring-card" />
    </div>
  );
}

export function RowDropIndicator() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative z-30 -my-[3px] flex items-center px-1"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500 ring-2 ring-card" />
      <span
        className="h-[2px] flex-1 rounded-full"
        style={{
          background: "linear-gradient(90deg, #7C3AED 0%, #a78bfa 100%)",
          boxShadow: "0 0 8px 2px rgba(124,58,237,0.4)",
        }}
      />
      <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500 ring-2 ring-card" />
    </div>
  );
}
