/**
 * appModules — central module registry
 *
 * Single source of truth for sidebar navigation and role-based access.
 * The router (src/app/router.tsx) owns component mapping.
 * This file owns label, icon, path, and role visibility for each module.
 */
import type { LucideIcon } from "lucide-react";
import { Code2, Link, Shield, Sparkles, Wand2, Zap } from "lucide-react";

type AppRole = "admin" | "disenador" | "programador" | "director" | "cencosud" | "mailing";

const STANDARD_MODULE_ROLES: AppRole[] = ["disenador", "programador", "director", "cencosud"];
const AMPSCRIPT_MODULE_ROLES: AppRole[] = ["programador", "mailing"];

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
    allowedRoles: STANDARD_MODULE_ROLES,
  },
  {
    id: "prompts",
    label: "Biblioteca de Prompts",
    icon: Sparkles,
    path: "/prompts",
    allowedRoles: STANDARD_MODULE_ROLES,
  },
  {
    id: "scripts",
    label: "Scripts Illustrator",
    icon: Code2,
    path: "/scripts",
    allowedRoles: STANDARD_MODULE_ROLES,
  },
  {
    id: "ampscript-builder",
    label: "AMPscript Builder",
    icon: Zap,
    path: "/ampscript-builder",
    allowedRoles: AMPSCRIPT_MODULE_ROLES,
  },
  {
    id: "banner-expand",
    label: "Relleno Generativo IA",
    icon: Wand2,
    path: "/banner-expand",
    allowedRoles: STANDARD_MODULE_ROLES,
  },
  {
    id: "admin",
    label: "Administración",
    icon: Shield,
    path: "/admin",
    allowedRoles: ["admin"],
  },
];
