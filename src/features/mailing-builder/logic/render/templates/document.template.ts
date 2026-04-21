/**
 * Template del documento completo — shell <!DOCTYPE html> email-safe.
 *
 * Incluye:
 *   - Preheader oculto (invisible en body, visible en previews de bandeja)
 *   - Tabla outer full-width para el body background
 *   - Tabla inner centrada con ancho fijo para el contenido
 *   - Font-family declarado inline en body (herencia máxima)
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
}

export function documentTemplate({
  subject,
  preheader,
  fontFamily,
  bodyBg,
  contentBg,
  width,
  rowsHtml,
}: DocumentTemplateData): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; word-spacing:normal; background-color:${bodyBg}; font-family:${fontFamily};">
  <!-- Preheader: visible en bandeja, oculto en body -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:${bodyBg}; mso-hide:all;">
    ${preheader}&zwnj;&nbsp;&#847; &zwnj;&nbsp;&#847; &zwnj;&nbsp;&#847; &zwnj;&nbsp;&#847;
  </div>

  <!-- Wrapper outer: background del body -->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
         style="background-color:${bodyBg}; width:100%;">
    <tr>
      <td align="center" style="padding:24px 0;">

        <!-- Contenedor central: background del contenido -->
        <!--[if mso]>
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="${width}">
          <tr>
            <td>
        <![endif]-->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0"
               style="width:100%; max-width:${width}px; background-color:${contentBg};">
          ${rowsHtml}
        </table>
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}
