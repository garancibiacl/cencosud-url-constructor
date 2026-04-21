/**
 * Utilidades HTML compartidas para el renderizado de bloques de mailing.
 *
 * Este módulo NO importa React ni tipos de bloque específicos — es puro
 * TypeScript de plataforma. Cualquier renderer de bloque puede importar
 * desde aquí sin crear dependencias circulares.
 */

import type { MailingBlock } from "../schema/block.types";
import type { MailingDocument } from "../schema/mailing.types";

// ---------------------------------------------------------------------------
// Paleta de colores de fallback (CSS custom properties → valores email-safe)
// ---------------------------------------------------------------------------

export const FALLBACK_COLORS = {
  background: "#f5f7fb",
  content: "#ffffff",
  foreground: "#0f172a",
  muted: "#475569",
  primary: "#0341a5",
  primaryForeground: "#ffffff",
  secondary: "#e2e8f0",
  border: "#dbe4f0",
} as const;

// ---------------------------------------------------------------------------
// Helpers de sanitización y escape
// ---------------------------------------------------------------------------

export const resolveColor = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  if (value.includes("var(--background)")) return FALLBACK_COLORS.background;
  if (value.includes("var(--card)")) return FALLBACK_COLORS.content;
  if (value.includes("var(--foreground)")) return FALLBACK_COLORS.foreground;
  if (value.includes("var(--muted-foreground)")) return FALLBACK_COLORS.muted;
  if (value.includes("var(--primary-foreground)")) return FALLBACK_COLORS.primaryForeground;
  if (value.includes("var(--primary)")) return FALLBACK_COLORS.primary;
  if (value.includes("var(--secondary)")) return FALLBACK_COLORS.secondary;
  if (value.includes("var(--border)")) return FALLBACK_COLORS.border;
  return value;
};

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sanitizeUrl = (value?: string): string => {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("mailto:")) return value;
  return `https://${value}`;
};

// ---------------------------------------------------------------------------
// Tracking UTM
// ---------------------------------------------------------------------------

export const buildTrackedUrl = (value: string | undefined, document: MailingDocument): string => {
  const sanitized = sanitizeUrl(value);
  const { linkTracking } = document.settings;

  if (!linkTracking.enabled || sanitized === "#" || sanitized.startsWith("mailto:") || sanitized.startsWith("tel:")) {
    return sanitized;
  }

  try {
    const url = sanitized.startsWith("http")
      ? new URL(sanitized)
      : new URL(sanitized, "https://placeholder.local");

    url.searchParams.set("utm_source", linkTracking.utmSource);
    url.searchParams.set("utm_medium", linkTracking.utmMedium);
    url.searchParams.set("utm_campaign", linkTracking.utmCampaign);
    if (linkTracking.promoName) {
      url.searchParams.set("nombre_promo", linkTracking.promoName);
    }

    return sanitized.startsWith("http") ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return sanitized;
  }
};

// ---------------------------------------------------------------------------
// Primitivo de envoltura table-based (email-safe layout)
// ---------------------------------------------------------------------------

export const getBlockPadding = (block: MailingBlock) => ({
  top: block.layout.padding?.top ?? 0,
  right: block.layout.padding?.right ?? 0,
  bottom: block.layout.padding?.bottom ?? 0,
  left: block.layout.padding?.left ?? 0,
});

export const wrapBlock = (block: MailingBlock, inner: string, backgroundColor?: string): string => {
  const p = getBlockPadding(block);
  const bg = resolveColor(backgroundColor ?? block.layout.backgroundColor, "transparent");
  return `
    <tr>
      <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bg};">
        ${inner}
      </td>
    </tr>
  `;
};
