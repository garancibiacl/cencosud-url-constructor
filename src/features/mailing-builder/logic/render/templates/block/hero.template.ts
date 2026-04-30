/**
 * Template HTML del bloque Hero.
 *
 * Esta función es HTML puro — NO contiene lógica de escape, tracking ni
 * resolución de colores. Recibe datos ya procesados y retorna un string
 * de HTML email-safe.
 *
 * Estándares aplicados:
 *   - Tabla role="presentation" para email clients
 *   - width="100%" + style width px (doble declaración para Outlook)
 *   - img display:block + border="0" atributo HTML para evitar espacios fantasma
 *   - font-family explícito en todos los nodos de texto (no herencia)
 *   - font-weight:700 declarado inline
 *   - valign en todos los <td>
 *   - target="_blank" en todos los <a>
 *   - mso-table-lspace/rspace en tablas inline
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
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr>
            <td valign="top" style="padding:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:${colors.muted};">
              ${subtitle}
            </td>
          </tr>
        </table>`
    : "";

  const ctaHtml = ctaLabel
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td valign="middle" bgcolor="${colors.primary}" style="background-color:${colors.primary};border-radius:6px;">
            <a href="${ctaHref}"
               target="_blank"
               style="display:inline-block;padding:14px 22px;font-size:14px;line-height:14px;font-weight:700;font-family:Arial,Helvetica,sans-serif;color:${colors.primaryForeground};text-decoration:none;border-radius:6px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return `<tr>
  <td valign="top" style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;background-color:${bgColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td valign="top">
          <img src="${imageUrl}" alt="${imageAlt}" width="100%" border="0"
               style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;max-width:100%;" />
        </td>
      </tr>
      <tr>
        <td valign="top" style="padding-top:24px;">
          <h1 style="margin:0;font-size:32px;line-height:38px;font-weight:700;font-family:Arial,Helvetica,sans-serif;color:${colors.foreground};">${title}</h1>
          ${subtitleHtml}
          ${ctaHtml}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
