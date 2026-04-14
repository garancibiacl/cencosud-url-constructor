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
      <div dangerouslySetInnerHTML={{ __html: `<l-hourglass size="${size}" color="${color}" speed="${speed}" bg-opacity="0.1"></l-hourglass>` }} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
