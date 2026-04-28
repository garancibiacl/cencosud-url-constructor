export interface ProductDdTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  imageUrl: string;
  discountLabel: string;
  discountBadgeBg: string;
  discountBadgeFg: string;
  secondBadge: string;
  secondBadgeBg: string;
  secondBadgeFg: string;
  originalPrice: string;
  price: string;
  priceColor: string;
  name: string;
  brand: string;
  unit: string;
  logoUrl: string;
  logoSize: number;
  logoAlign: string;
  href: string;
  ctaLabel: string;
  primaryColor: string;
  primaryForeground: string;
}

export function productDdTemplate({
  padding: p,
  bgColor,
  borderRadius,
  borderWidth,
  borderColor,
  imageUrl,
  discountLabel,
  discountBadgeBg,
  discountBadgeFg,
  secondBadge,
  secondBadgeBg,
  secondBadgeFg,
  originalPrice,
  price,
  priceColor,
  name,
  brand,
  unit,
  logoUrl,
  logoSize,
  logoAlign,
  href,
  ctaLabel,
  primaryColor,
  primaryForeground,
}: ProductDdTemplateData): string {

  // ── Badge secundaria ───────────────────────────────────────────────────────
  const secondBadgeHtml = secondBadge
    ? `<span style="display:inline-block;font-size:10px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${secondBadgeFg};background-color:${secondBadgeBg};padding:3px 8px;border-radius:12px;line-height:1;margin-left:4px;">${secondBadge}</span>`
    : "";

  // ── Unit badge ─────────────────────────────────────────────────────────────
  const unitHtml = unit
    ? `<div style="margin-top:4px;"><span style="display:inline-block;font-size:11px;font-family:Arial,Helvetica,sans-serif;color:#000000;background-color:#f3f4f6;padding:3px 6px;border-radius:12px;">${unit}</span></div>`
    : "";

  // ── Brand ──────────────────────────────────────────────────────────────────
  const brandHtml = brand
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;margin-top:4px;line-height:1.4;">${brand}</div>`
    : "";

  // ── Logo ───────────────────────────────────────────────────────────────────
  const logoAlignValue = logoAlign === "center" ? "center" : logoAlign === "right" ? "right" : "left";
  const logoHtml = logoUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:6px;">
        <tr>
          <td align="${logoAlignValue}">
            <img src="${logoUrl}" alt="logo" width="${logoSize}" style="display:block;width:${logoSize}px;height:auto;border:0;" />
          </td>
        </tr>
      </table>`
    : "";

  const borderStyle = borderWidth > 0
    ? `border:${borderWidth}px solid ${borderColor};`
    : "";
  const radiusStyle = borderRadius > 0
    ? `border-radius:${borderRadius}px; -webkit-border-radius:${borderRadius}px; -moz-border-radius:${borderRadius}px;`
    : "";

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor}; font-family:Arial,Helvetica,sans-serif; vertical-align:top; ${borderStyle} ${radiusStyle}">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <!-- LEFT COLUMN: imagen + badges -->
        <td width="50%" valign="top" style="vertical-align:top;">
          <!-- Badges encima de la imagen -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="padding:8px 8px 0;">
                <span style="display:inline-block;font-size:10px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${discountBadgeFg};background-color:${discountBadgeBg};padding:3px 8px;border-radius:12px;line-height:1;">${discountLabel}</span>${secondBadgeHtml}
              </td>
            </tr>
          </table>
          <!-- Imagen -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td align="center" style="padding:8px;">
                <a href="${href}" target="_blank" style="text-decoration:none;color:#000000;">
                  <img src="${imageUrl || "/placeholder.svg"}"
                       alt="${name}"
                       width="140"
                       style="display:block!important;width:140px;height:auto;margin:0 auto;border:0;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
        <!-- RIGHT COLUMN: logo + precios + info + CTA -->
        <td width="50%" valign="top" style="padding:8px 12px 8px 8px;vertical-align:top;">
          ${logoHtml}
          <!-- Precio original tachado -->
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;text-decoration:line-through;line-height:1.2;">${originalPrice}</div>
          <!-- Precio con descuento -->
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:${priceColor};line-height:1.1;margin-top:2px;">${price}</div>
          ${unitHtml}
          ${brandHtml}
          <!-- Nombre del producto -->
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#000000;font-weight:normal;line-height:18px;margin-top:4px;">${name}</div>
          <!-- CTA -->
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin-top:12px;display:inline-table;">
            <tr>
              <td align="center" bgcolor="${primaryColor}" style="border-radius:8px;width:1%;white-space:nowrap;">
                <a href="${href}"
                   target="_blank"
                   style="background-color:${primaryColor};color:${primaryForeground};display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;line-height:32px;text-align:center;text-decoration:none;min-width:120px;padding:0 16px;border-radius:8px;white-space:nowrap;-webkit-text-size-adjust:none;">
                  ${ctaLabel}
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
