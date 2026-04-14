import { useEffect } from "react";

let registered = false;

export default function LdrsLoader({
  size = 40,
  color = "hsl(var(--primary))",
  speed = 1.75,
  label,
}: {
  size?: number;
  color?: string;
  speed?: number;
  label?: string;
}) {
  useEffect(() => {
    if (!registered) {
      import("ldrs").then(({ hourglass }) => {
        hourglass.register();
      });
      registered = true;
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* @ts-expect-error - ldrs web component */}
      <l-hourglass size={String(size)} color={color} speed={String(speed)} bg-opacity="0.1" />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
