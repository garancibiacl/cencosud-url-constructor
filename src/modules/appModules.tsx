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
import { Code2, Link, Shield, Sparkles, Wand2, Zap } from "lucide-react";

export type AppModuleId =
  | "constructor-url"
  | "banner-expand"
  | "prompts"
  | "scripts"
  | "ampscript-builder"
  | "admin";

export interface AppModuleDefinition {
  id: AppModuleId;
  label: string;
  icon: LucideIcon;
  path: string;
  /**
   * Roles that can access this module.
   * - undefined / empty → visible for ALL roles.
   * - non-empty → only listed roles see it.
   * "admin" always has access to every module regardless of this list.
   */
  allowedRoles?: AppRole[];
}

/** Utility: checks if a role can access a module */
export function canAccessModule(mod: AppModuleDefinition, role: AppRole | null): boolean {
  if (role === "admin") return true;
  if (!mod.allowedRoles || mod.allowedRoles.length === 0) return true;
  return role !== null && mod.allowedRoles.includes(role);
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
    id: "ampscript-builder",
    label: "AMPscript Builder",
    icon: Zap,
    path: "/ampscript-builder",
  },
  {
    id: "banner-expand",
    label: "Relleno Generativo IA",
    icon: Wand2,
    path: "/banner-expand",
  },
  {
    id: "admin",
    label: "Administración",
    icon: Shield,
    path: "/admin",
    adminOnly: true,
  },
];
