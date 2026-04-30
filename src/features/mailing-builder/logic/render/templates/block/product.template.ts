/**
 * Template HTML del bloque Product (tarjeta de producto simple).
 *
 * Estándares aplicados:
 *   - role="presentation" border="0" cellpadding="0" cellspacing="0" en tablas
 *   - valign explícito en todos los <td>
 *   - border="0" como atributo HTML en <img>
 *   - target="_blank" en todos los <a>
 *   - font-family explícito en todos los nodos de texto
 *   - Colores en HEX de 6 dígitos
 *   - mso-table-lspace/rspace en tablas inline
 */

export interface ProductTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  imageUrl: string;
  name: string;
  brand: string;
  price: string;
  unit: string;
  href: string;
  ctaLabel: string;
  primaryColor: string;
  primaryForeground: string;
}

export function productTemplate({
  padding: p,
  bgColor,
  imageUrl,
  name,
  brand,
  price,
  unit,
  href,
  ctaLabel,
  primaryColor,
  primaryForeground,
}: ProductTemplateData): string {
  const unitRow = unit
    ? `<tr>
        <td valign="top" style="padding:4px 16px 0 16px;font-family:Arial,Helvetica,sans-serif;">
          <span style="font-size:11px;color:#000000;font-weight:normal;background-color:#f3f4f6;padding:4px;border-radius:16px;font-family:Arial,Helvetica,sans-serif;">${unit}</span>
        </td>
      </tr>`
    : "";

  const brandRow = brand
    ? `<tr>
        <td valign="top" style="padding:0 16px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;height:36px;">${brand}</td>
      </tr>`
    : `<tr><td valign="top" style="height:36px;line-height:36px;font-size:0;">&nbsp;</td></tr>`;

  return `<tr>
  <td valign="top" style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;background-color:${bgColor};border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td valign="top" style="height:30px;line-height:30px;font-size:1px;">&nbsp;</td>
      </tr>
      <tr>
        <td valign="top" align="center" style="padding:12px 16px;height:200px;">
          <a href="${href}" target="_blank" style="text-decoration:none;color:#000000;display:block;line-height:0;">
            <img src="${imageUrl || "/placeholder.svg"}"
                 alt="${name}"
                 width="152"
                 border="0"
                 style="display:block;border:0;outline:none;text-decoration:none;width:152px;height:auto;margin:0;" />
          </a>
        </td>
      </tr>
      <tr>
        <td valign="top" style="padding:4px 16px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;font-weight:bold;">
          ${price}
        </td>
      </tr>
      ${unitRow}
      <tr><td valign="top" style="height:8px;line-height:8px;font-size:1px;">&nbsp;</td></tr>
      ${brandRow}
      <tr><td valign="top" style="height:4px;line-height:4px;font-size:1px;">&nbsp;</td></tr>
      <tr>
        <td valign="top" style="padding:0 16px;height:60px;">
          <a href="${href}" target="_blank" style="text-decoration:none;">
            <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;font-weight:normal;line-height:18px;margin:0;">${name}</h2>
          </a>
        </td>
      </tr>
      <tr><td valign="top" style="height:12px;line-height:12px;font-size:1px;">&nbsp;</td></tr>
      <tr>
        <td valign="top" style="padding:0 16px;">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="160" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td valign="middle" align="center">
                <a href="${href}"
                   target="_blank"
                   style="background-color:${primaryColor};color:${primaryForeground};display:block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:36px;text-align:center;text-decoration:none;width:160px;border-radius:8px;-webkit-text-size-adjust:none;">
                  ${ctaLabel}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td valign="top" style="height:8px;line-height:8px;font-size:1px;">&nbsp;</td></tr>
    </table>
  </td>
</tr>`;
}
