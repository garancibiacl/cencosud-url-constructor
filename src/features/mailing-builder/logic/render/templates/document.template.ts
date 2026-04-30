/**
 * Template del documento completo — shell <!DOCTYPE html> email-safe.
 *
 * Estándares aplicados:
 *   - XHTML 1.0 Transitional DOCTYPE (máxima compatibilidad Outlook/legacy)
 *   - Meta tags obligatorios incluyendo http-equiv Content-Type
 *   - CSS reset completo: text-size-adjust, mso-table spacing, img display:block
 *   - Fix Gmail (u + #body a) y fix Outlook (.ReadMsgBody/.ExternalClass)
 *   - Conditional comments VML para font override en Outlook
 *   - Preheader con zero-width non-joiner padding correcto
 *   - Outer table full-width + MSO conditional + inner table centrada
 *   - SFMC: AMPscript personalización + footer legal (solo cuando sfmcMode=true)
 */

export interface DocumentTemplateData {
  /** Subject ya escapado. */
  subject: string;
  /** Preheader ya escapado. */
  preheader: string;
  /** Familia tipográfica completa (ej: "Arial, Helvetica, sans-serif"). */
  fontFamily: string;
  /** Color de fondo del body ya resuelto a hex/rgb. */
  bodyBg: string;
  /** Color de fondo del contenedor central ya resuelto a hex/rgb. */
  contentBg: string;
  /** Ancho del contenedor en px (ej: 600). */
  width: number;
  /** HTML de todas las filas ya renderizado. */
  rowsHtml: string;
  /** CSS adicional de marca (compat Outlook, font imports). */
  brandCss?: string;
  /** HTML del header de marca (logo + nav + saludo). */
  brandHeader?: string;
  /** HTML del footer de marca (legales + redes sociales). */
  brandFooter?: string;
  /**
   * Si true, inyecta el pixel de tracking SFMC en <head>.
   * Mantenido por compatibilidad con renderEngine.ts existente.
   */
  sfmcTracking?: boolean;
  /**
   * Si true, añade el bloque AMPscript de personalización justo después de
   * <body> y el footer SFMC obligatorio (unsubscribe + view in browser)
   * antes de </body>. Por defecto false para no romper integraciones existentes.
   */
  sfmcMode?: boolean;
}

export function documentTemplate({
  subject,
  preheader,
  fontFamily,
  bodyBg,
  contentBg,
  width,
  rowsHtml,
  brandCss,
  brandHeader,
  brandFooter,
  sfmcTracking,
  sfmcMode = false,
}: DocumentTemplateData): string {

  // ── Head extras ────────────────────────────────────────────────────────────
  const sfmcPixel = sfmcTracking
    ? `  <custom name="opencounter" type="tracking" />`
    : "";
  const brandCssBlock = brandCss
    ? `  <style type="text/css">\n${brandCss}\n  </style>`
    : "";
  const headExtras = [sfmcPixel, brandCssBlock].filter(Boolean).join("\n");

  // ── AMPscript personalización (solo sfmcMode) ──────────────────────────────
  const ampscriptBlock = sfmcMode
    ? `%%[
/* Cencosud Email — AMPscript personalización */
SET @email     = AttributeValue("emailaddr")
SET @firstName = AttributeValue("firstname")
SET @lastName  = AttributeValue("lastname")
SET @subKey    = AttributeValue("_subscriberkey")
]%%
`
    : "";

  // ── Footer SFMC obligatorio (solo sfmcMode) ────────────────────────────────
  const sfmcFooterHtml = sfmcMode
    ? `<!-- SFMC Required: Unsubscribe + View in browser -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr>
            <td align="center" valign="top" style="padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#999999;">
              <a href="%%profile_center_url%%" style="color:#999999;text-decoration:underline;font-family:Arial,Helvetica,sans-serif;">Actualizar preferencias</a>
              &nbsp;|&nbsp;
              <a href="%%unsub_center_url%%" alias="Unsubscribe" style="color:#999999;text-decoration:underline;font-family:Arial,Helvetica,sans-serif;">Darse de baja</a>
              &nbsp;|&nbsp;
              <a href="%%view_email_url%%" style="color:#999999;text-decoration:underline;font-family:Arial,Helvetica,sans-serif;">Ver en navegador</a>
            </td>
          </tr>
        </table>`
    : "";

  // ── Brand header row ────────────────────────────────────────────────────────
  const brandHeaderRow = brandHeader
    ? `<tr>
          <td align="center" valign="top" style="padding:0;">
            ${brandHeader}
          </td>
        </tr>`
    : "";

  // ── Brand footer row ────────────────────────────────────────────────────────
  const brandFooterRow = brandFooter
    ? `<tr>
          <td align="center" valign="top" style="padding:0;">
            ${brandFooter}
          </td>
        </tr>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    body, table, td, p, a, li { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* ── Reset ──────────────────────────────────────────────────────────── */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    /* ── Prevent blue links on iOS ──────────────────────────────────────── */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* ── Gmail blue-link fix ────────────────────────────────────────────── */
    u + #body a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
    /* ── Outlook width normalization ────────────────────────────────────── */
    .ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    /* ── Responsive ─────────────────────────────────────────────────────── */
    @media only screen and (max-width: 600px) {
      .mc { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important; box-sizing: border-box !important; }
      .mc-img img { max-width: 100% !important; height: auto !important; width: 100% !important; }
      img { max-width: 100% !important; height: auto !important; }
    }
  </style>${headExtras ? `\n${headExtras}` : ""}
</head>
<body id="body" style="margin:0;padding:0;word-spacing:normal;background-color:${bodyBg};font-family:${fontFamily};">
${ampscriptBlock}  <!-- Preheader: visible en bandeja, oculto en body -->
  <div style="display:none;font-size:1px;color:${bodyBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;&#8204;
  </div>

  <!-- Outer table: background del body full-width -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:${bodyBg};">
    ${brandHeaderRow}
    <tr>
      <td align="center" valign="top" style="padding:0;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${width}">
          <tr><td valign="top">
        <![endif]-->

        <!-- Inner content table: centrada, ancho fijo -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${width}" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:${width}px;width:100%;background-color:${contentBg};">
          ${rowsHtml}
        </table>

        <!--[if (gte mso 9)|(IE)]>
          </td></tr>
        </table>
        <![endif]-->
      </td>
    </tr>
    ${brandFooterRow}
    ${sfmcFooterHtml ? `<tr>
      <td align="center" valign="top" style="padding:0;background-color:${bodyBg};">
        ${sfmcFooterHtml}
      </td>
    </tr>` : ""}
  </table>
</body>
</html>`;
}
