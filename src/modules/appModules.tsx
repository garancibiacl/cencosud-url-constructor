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
import { Code2, Link, Settings, Shield, Sparkles, Wand2 } from "lucide-react";

export type AppModuleId =
  | "constructor-url"
  | "banner-expand"
  | "settings"
  | "prompts"
  | "scripts"
  | "admin";

export interface AppModuleDefinition {
  id: AppModuleId;
  label: string;
  icon: LucideIcon;
  path: string;
  /** If set, only users with this role see the module */
  adminOnly?: boolean;
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
    id: "scripts",
    label: "Scripts Illustrator",
    icon: Code2,
    path: "/scripts",
  },
  {
    id: "banner-expand",
    label: "Relleno Generativo IA",
    icon: Wand2,
    path: "/banner-expand",
  },
  {
    id: "settings",
    label: "Configuración",
    icon: Settings,
    path: "/configuracion",
  },
  {
    id: "admin",
    label: "Administración",
    icon: Shield,
    path: "/admin",
    adminOnly: true,
  },
];
