/**
 * appModules — central module registry
 *
 * Single source of truth for sidebar navigation.
 * The router (src/app/router.tsx) owns component mapping.
 * This file owns label, icon, and path for each module.
 *
 * HOW TO REGISTER A NEW MODULE (step 3 of 3):
 *  Add an entry to `appModules` with the same path used in router.tsx.
 */
import type { LucideIcon } from "lucide-react";
import { History, Image, Link, Settings, Sparkles, Wand2 } from "lucide-react";

export type AppModuleId =
  | "constructor-url"
  | "image-optimizer"
  | "banner-expand"
  | "history"
  | "settings"
  | "prompts";

export interface AppModuleDefinition {
  id: AppModuleId;
  label: string;
  icon: LucideIcon;
  /** Must match the path registered in src/app/router.tsx */
  path: string;
}

export const appModules: AppModuleDefinition[] = [
  {
    id: "constructor-url",
    label: "Constructor de URLs",
    icon: Link,
    path: "/constructor-url",
  },
  {
    id: "prompts",
    label: "Biblioteca de Prompts",
    icon: Sparkles,
    path: "/prompts",
  },
  {
    id: "image-optimizer",
    label: "Optimizador de Imágenes",
    icon: Image,
    path: "/optimizador",
  },
  {
    id: "banner-expand",
    label: "Relleno Generativo IA",
    icon: Wand2,
    path: "/banner-expand",
  },
  {
    id: "history",
    label: "Historial de Campañas",
    icon: History,
    path: "/historial",
  },
  {
    id: "settings",
    label: "Configuración",
    icon: Settings,
    path: "/configuracion",
  },
];
