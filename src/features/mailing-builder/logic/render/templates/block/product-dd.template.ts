export interface ProductDdTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  borderRadius: number;
  borderRadiusTL: number;
  borderRadiusTR: number;
  borderRadiusBR: number;
  borderRadiusBL: number;
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
  // Columna derecha rediseñada
  rightBgColor: string;
  priceSize: number;
  priceFg: string;
  ahorroLabel: string;
  desdeLabel: string;
  // Etiqueta dual de precio (split badge)
  priceTagShow:    boolean;
  priceTagLabel:   string;
  priceTagLabelBg: string;
  priceTagLabelFg: string;
  priceTagValue:   string;
  priceTagValueBg: string;
  priceTagValueFg: string;
  priceTagRadius:  number;
  priceTagAlign:   "left" | "center" | "right";
}

export function productDdTemplate({
  padding: p,
  bgColor,
  borderRadius,
  borderRadiusTL,
  borderRadiusTR,
  borderRadiusBR,
  borderRadiusBL,
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
  // priceColor kept in interface for backwards-compat, superseded by priceFg
  name,
  // brand kept in interface for backwards-compat, not rendered in new layout
  unit,
  logoUrl,
  logoSize,
  logoAlign,
  href,
  ctaLabel,
  primaryColor,
  primaryForeground,
  rightBgColor,
  priceSize,
  priceFg,
  ahorroLabel,
  desdeLabel,
  priceTagShow,
  priceTagLabel,
  priceTagLabelBg,
  priceTagLabelFg,
  priceTagValue,
  priceTagValueBg,
  priceTagValueFg,
  priceTagRadius,
  priceTagAlign,
}: ProductDdTemplateData): string {

  // ── Badge secundaria ───────────────────────────────────────────────────────
  const secondBadgeHtml = secondBadge
    ? `<span style="display:inline-block;font-size:10px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${secondBadgeFg};background-color:${secondBadgeBg};padding:3px 8px;border-radius:12px;line-height:1;margin-left:4px;">${secondBadge}</span>`
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

  // ── Precio original tachado (blanco semitransparente) ─────────────────────
  const originalPriceHtml = originalPrice
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.7);text-decoration:line-through;line-height:1.2;margin-bottom:4px;">${originalPrice}</div>`
    : "";

  // ── Precio grande + unidad inline (tabla email-safe) ──────────────────────
  const unitInlineHtml = unit
    ? `<td style="padding:0;vertical-align:baseline;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${priceFg};margin-left:3px;line-height:1;">${unit}</span>
      </td>`
    : "";
  const priceRowHtml = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:6px;">
    <tr>
      <td style="padding:0;vertical-align:baseline;">
        <span style="font-family:'Silka',Arial,Helvetica,sans-serif;font-size:${priceSize}px;font-weight:700;color:${priceFg};line-height:1;">${price}</span>
      </td>
      ${unitInlineHtml}
    </tr>
  </table>`;

  // ── Badge ahorro ───────────────────────────────────────────────────────────
  const ahorroHtml = ahorroLabel
    ? `<div style="margin-bottom:4px;">
        <span style="display:inline-block;background:rgba(0,0,0,0.2);border-radius:6px;padding:4px 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;font-weight:700;line-height:1.2;">Ahorro ${ahorroLabel}</span>
      </div>`
    : "";

  // ── Desde label ────────────────────────────────────────────────────────────
  const desdeLabelHtml = desdeLabel
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;margin-bottom:4px;">${desdeLabel}</div>`
    : "";

  // ── Split badge (etiqueta dual de precio) ──────────────────────────────────
  const r = priceTagRadius;
  const tagTableAlign = priceTagAlign === "center" ? "center" : priceTagAlign === "right" ? "right" : "left";
  const priceTagHtml = priceTagShow
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="margin-top:8px;">
        <tr>
          <td align="${tagTableAlign}">
            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
                <td style="padding:3px 6px 3px 8px;background-color:${priceTagLabelBg};color:${priceTagLabelFg};border-radius:${r}px 0 0 ${r}px;font-family:'Silka',Arial,Helvetica,sans-serif;font-size:17px;font-weight:900;line-height:1.2;white-space:nowrap;vertical-align:middle;">${priceTagLabel}</td>
                <td style="padding:3px 10px 3px 6px;background-color:${priceTagValueBg};color:${priceTagValueFg};border-radius:0 ${r}px ${r}px 0;font-family:'Silka',Arial,Helvetica,sans-serif;font-size:21px;font-weight:900;line-height:1.2;white-space:nowrap;vertical-align:middle;">${priceTagValue}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  const ctaHtml = "";

  const tl = borderRadiusTL;
  const tr = borderRadiusTR;
  const br = borderRadiusBR;
  const bl = borderRadiusBL;
  const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
  const outerRadius = hasRadius ? `border-radius:${tl}px ${tr}px ${br}px ${bl}px; overflow:hidden;` : "";
  const borderStyle = borderWidth > 0 ? `border:${borderWidth}px solid ${borderColor};` : "";
  // Columna izquierda: esquinas TL y BL
  const leftColRadius = hasRadius ? `border-radius:${tl}px 0 0 ${bl}px; overflow:hidden;` : "";
  // Columna derecha: esquinas TR y BR
  const rightColRadius = hasRadius ? `border-radius:0 ${tr}px ${br}px 0; overflow:hidden;` : "";

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor}; font-family:Arial,Helvetica,sans-serif; vertical-align:top; ${borderStyle} ${outerRadius}">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <!-- LEFT COLUMN: imagen + badges -->
        <td width="50%" valign="top" style="vertical-align:top; ${leftColRadius}">
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
        <!-- RIGHT COLUMN: fondo de color, precio grande, ahorro, desde -->
        <td width="50%" valign="middle" style="background-color:${rightBgColor};padding:12px 14px;vertical-align:middle; ${rightColRadius}">
          ${logoHtml}
          ${originalPriceHtml}
          ${priceRowHtml}
          ${ahorroHtml}
          ${desdeLabelHtml}
          ${priceTagHtml}
          <!-- Nombre del producto -->
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.9);margin-top:6px;line-height:1.4;">${name}</div>
          ${ctaHtml}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
