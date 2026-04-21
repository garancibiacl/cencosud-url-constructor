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
        <td style="padding:4px 16px 0 16px;">
          <span style="font-size:11px;color:#000000;font-weight:normal;background-color:#f3f4f6;padding:4px;border-radius:16px;">${unit}</span>
        </td>
      </tr>`
    : "";

  const brandRow = brand
    ? `<tr>
        <td style="padding:0 16px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;height:36px;">${brand}</td>
      </tr>`
    : `<tr><td style="height:36px;"></td></tr>`;

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor}; border-bottom:1px solid #e5e7eb; font-family:Arial,Helvetica,sans-serif; vertical-align:top;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="height:30px;line-height:30px;font-size:1px;">&nbsp;</td>
      </tr>
      <tr>
        <td align="center" style="padding:12px 16px;height:200px;">
          <a href="${href}" target="_blank" style="text-decoration:none;color:#000000;">
            <img src="${imageUrl || "/placeholder.svg"}"
                 alt="${name}"
                 width="152"
                 style="display:block!important;width:152px;height:auto;margin:0;border:0;" />
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 16px 0 16px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;font-weight:bold;">${price}</div>
        </td>
      </tr>
      ${unitRow}
      <tr><td style="height:8px;line-height:8px;font-size:1px;">&nbsp;</td></tr>
      ${brandRow}
      <tr><td style="height:4px;line-height:4px;font-size:1px;">&nbsp;</td></tr>
      <tr>
        <td style="padding:0 16px;height:60px;vertical-align:top;">
          <a href="${href}" target="_blank" style="text-decoration:none;">
            <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;font-weight:normal;line-height:18px;margin:0;">${name}</h2>
          </a>
        </td>
      </tr>
      <tr><td style="height:12px;line-height:12px;font-size:1px;">&nbsp;</td></tr>
      <tr>
        <td style="padding:0 16px;">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="160">
            <tr>
              <td align="center">
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
      <tr><td style="height:8px;line-height:8px;font-size:1px;">&nbsp;</td></tr>
    </table>
  </td>
</tr>`;
}
