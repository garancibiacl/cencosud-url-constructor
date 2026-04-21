/**
 * Template HTML del bloque Hero.
 *
 * Esta función es HTML puro — NO contiene lógica de escape, tracking ni
 * resolución de colores. Recibe datos ya procesados y retorna un string
 * de HTML email-safe.
 *
 * Audit checklist:
 *   ✓ Tabla role="presentation" para email clients
 *   ✓ width="100%" + style width px (doble declaración para Outlook)
 *   ✓ img display:block para evitar espacios fantasma
 *   ✓ font-weight:700 declarado inline (no herencia)
 */

export interface HeroTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  /** URL ya escapada. */
  imageUrl: string;
  /** Alt text ya escapado. */
  imageAlt: string;
  /** Título ya escapado. */
  title: string;
  /** Bajada ya escapada. Cadena vacía si no aplica. */
  subtitle: string;
  /** Label del CTA ya escapado. Cadena vacía si no hay CTA. */
  ctaLabel: string;
  /** URL del CTA ya trackeada y escapada. */
  ctaHref: string;
  colors: {
    foreground: string;
    muted: string;
    primary: string;
    primaryForeground: string;
  };
}

export function heroTemplate({
  padding: p,
  bgColor,
  imageUrl,
  imageAlt,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  colors,
}: HeroTemplateData): string {
  const subtitleHtml = subtitle
    ? `<p style="margin:8px 0 0; font-size:16px; line-height:24px; color:${colors.muted};">${subtitle}</p>`
    : "";

  const ctaHtml = ctaLabel
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
        <tr>
          <td bgcolor="${colors.primary}" style="border-radius:6px;">
            <a href="${ctaHref}"
               style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:${colors.primaryForeground}; text-decoration:none; border-radius:6px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <img src="${imageUrl}" alt="${imageAlt}" width="100%"
               style="display:block; width:100%; height:auto; max-width:100%; border:0;" />
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;">
          <h1 style="margin:0; font-size:32px; line-height:38px; font-weight:700; color:${colors.foreground};">${title}</h1>
          ${subtitleHtml}
          ${ctaHtml}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
