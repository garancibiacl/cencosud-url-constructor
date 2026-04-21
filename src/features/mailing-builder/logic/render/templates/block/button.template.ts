/**
 * Template HTML del bloque Button.
 *
 * Usa tabla anidada para centrar/alinear el botón de forma compatible
 * con Outlook y clientes legacy.
 */

export interface ButtonTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  /** Texto del botón ya escapado. */
  label: string;
  /** URL del link ya trackeada y escapada. */
  href: string;
  /** "left" | "center" | "right" */
  align: string;
  colors: {
    primary: string;
    primaryForeground: string;
  };
}

export function buttonTemplate({
  padding: p,
  bgColor,
  label,
  href,
  align,
  colors,
}: ButtonTemplateData): string {
  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="${align}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td bgcolor="${colors.primary}" style="border-radius:6px; mso-padding-alt:0;">
                <a href="${href}"
                   style="display:inline-block; padding:14px 28px; font-size:14px; line-height:20px; font-weight:700; color:${colors.primaryForeground}; text-decoration:none; border-radius:6px; mso-hide:none;">
                  <!--[if mso]><i style="letter-spacing:25px; mso-font-width:-100%; mso-text-raise:30pt;">&nbsp;</i><![endif]-->
                  ${label}
                  <!--[if mso]><i style="letter-spacing:25px; mso-font-width:-100%;">&nbsp;</i><![endif]-->
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
