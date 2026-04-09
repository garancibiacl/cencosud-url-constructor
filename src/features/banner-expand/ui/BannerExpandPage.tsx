import { Wand2 } from "lucide-react";
import { AutoBannerExpand } from "@/modules/auto-banner-expand";

export default function BannerExpandPage() {
  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Wand2 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Relleno Generativo IA
            </h1>
            <p className="text-sm text-muted-foreground">
              Expande imagenes de producto a formatos banner con DALL-E 2 sin Photoshop.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          <AutoBannerExpand defaultPresetId="HUINCHA_JUMBO_SISA_desktop" />
        </div>
      </div>
    </div>
  );
}
