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
  badgeTop?: number;
  badgeLeft?: number;
  badgeFontSize?: number;
  badgeBorderRadius?: number;
  badgeRadiusTL?: number;
  badgeRadiusTR?: number;
  badgeRadiusBR?: number;
  badgeRadiusBL?: number;
  badgeBorderWidth?: number;
  badgeBorderColor?: string;
  secondBadge: string;
  secondBadgeBg: string;
  secondBadgeFg: string;
  originalPrice?: string;
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
  // ── Descuento porcentual ──────────────────────────────────────────────────
  discountNumber?: string;
  discountNumberColor?: string;
  discountSymbol?: string;
  discountSymbolColor?: string;
  discountText?: string;
  discountTextColor?: string;
  discountAlign?: "left" | "center" | "right";
  // ── Badge Oferta ─────────────────────────────────────────────────────────
  ofertaShow?: boolean;
  ofertaLabel?: string;
  ofertaLabelFg?: string;
  ofertaLogoUrl?: string;
  ofertaLogoSize?: number;
  ofertaBg?: string;
  ofertaBorderRadius?: number;
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
  badgeTop,
  badgeLeft,
  badgeFontSize,
  badgeBorderRadius,
  badgeRadiusTL,
  badgeRadiusTR,
  badgeRadiusBR,
  badgeRadiusBL,
  badgeBorderWidth,
  badgeBorderColor,
  secondBadge,
  secondBadgeBg,
  secondBadgeFg,
  // originalPrice kept in interface for backwards-compat, not rendered
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
  discountNumber,
  discountNumberColor,
  discountSymbol,
  discountSymbolColor,
  discountText,
  discountTextColor,
  ofertaShow,
  ofertaLabel,
  ofertaLabelFg,
  ofertaLogoUrl,
  ofertaLogoSize,
  ofertaBg,
  ofertaBorderRadius,
  discountAlign,
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

  // ── Badge Oferta (inline, a la derecha del símbolo) ───────────────────────
  const ofertaCellHtml = (ofertaShow && (ofertaLabel || ofertaLogoUrl))
    ? `<td style="padding:0 0 0 6px;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="background-color:${ofertaBg && ofertaBg !== "transparent" ? ofertaBg : "transparent"};border-radius:${ofertaBorderRadius ?? 6}px;padding:${ofertaBg && ofertaBg !== "transparent" ? "3px 6px" : "0"};vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  ${ofertaLabel ? `<td style="padding:0;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${ofertaLabelFg ?? "#1a5c2a"};white-space:nowrap;padding-right:${ofertaLogoUrl ? "3px" : "0"};">${ofertaLabel}</td>` : ""}
                  ${ofertaLogoUrl ? `<td style="padding:0;vertical-align:middle;"><img src="${ofertaLogoUrl}" alt="" width="${ofertaLogoSize ?? 60}" style="display:block;width:${ofertaLogoSize ?? 60}px;height:auto;border:0;" /></td>` : ""}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>`
    : "";

  // ── Descuento porcentual: número + símbolo/texto + badge oferta en la misma fila ──
  const discountRowAlign = discountAlign === "center" ? "center" : discountAlign === "right" ? "right" : "left";
  const discountPctHtml = discountNumber
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="margin-bottom:4px;">
        <tr>
          <td align="${discountRowAlign}">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="padding:0;vertical-align:middle;">
                  <span style="font-family:'Silka',Arial,Helvetica,sans-serif;font-size:64px;font-weight:900;color:${discountNumberColor ?? "#ffffff"};line-height:1;">${discountNumber}</span>
                </td>
                <td style="padding:0 0 0 3px;vertical-align:middle;">
                  <div style="font-family:'Silka',Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;color:${discountSymbolColor ?? "#ffffff"};line-height:1;">${discountSymbol ?? "%"}</div>
                  <div style="font-family:'Silka',Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${discountTextColor ?? "#ffffff"};line-height:1.2;margin-top:2px;">${discountText ?? "DCTO."}</div>
                </td>
                ${ofertaCellHtml}
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  const ofertaBadgeHtml = "";

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

  // ── Badge principal: estilos dinámicos ────────────────────────────────────
  const bTop      = badgeTop  ?? 10;
  const bLeft     = badgeLeft ?? 50;
  const bFontSize = badgeFontSize ?? 12;
  const bBase     = badgeBorderRadius ?? 20;
  const bTL = badgeRadiusTL ?? bBase;
  const bTR = badgeRadiusTR ?? bBase;
  const bBR = badgeRadiusBR ?? bBase;
  const bBL = badgeRadiusBL ?? bBase;
  const bRadiusStr = (badgeRadiusTL !== undefined || badgeRadiusTR !== undefined || badgeRadiusBR !== undefined || badgeRadiusBL !== undefined)
    ? `${bTL}px ${bTR}px ${bBR}px ${bBL}px`
    : `${bBase}px`;
  const bBorderW  = badgeBorderWidth ?? 0;
  const bBorder   = bBorderW > 0 ? `border:${bBorderW}px solid ${badgeBorderColor ?? "#000000"};` : "";
  const badgeStyle = `display:inline-block;font-size:${bFontSize}px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${discountBadgeFg};background-color:${discountBadgeBg};padding:4px 10px;border-radius:${bRadiusStr};line-height:1;white-space:nowrap;${bBorder}`;

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

  const blockHref = href || "#";

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor}; font-family:Arial,Helvetica,sans-serif; vertical-align:top; ${borderStyle} ${outerRadius}">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;">
      <tr>
        <!-- LEFT COLUMN: imagen a full width + badges superpuestos -->
        <td width="50%" valign="top" style="vertical-align:top;padding:0;position:relative;max-width:50%;overflow:hidden; ${leftColRadius}">
          <a href="${blockHref}" target="_blank" style="text-decoration:none;display:block;line-height:0;">
            <img src="${imageUrl || "/placeholder.svg"}" alt="${name}" width="100%" style="display:block!important;width:100%;height:auto;border:0;" />
          </a>
          <!-- Badge principal: posición desde inspector (% con centrado) -->
          <div style="position:absolute;top:${bTop}%;left:${bLeft}%;transform:translate(-50%,-50%);line-height:1;white-space:nowrap;">
            <span style="${badgeStyle}">${discountLabel}</span>${secondBadgeHtml}
          </div>
        </td>
        <!-- RIGHT COLUMN: fondo de color, precio grande, ahorro, desde -->
        <td width="50%" valign="middle" style="background-color:${rightBgColor};padding:0;vertical-align:middle;max-width:50%;overflow:hidden; ${rightColRadius}">
          <a href="${blockHref}" target="_blank" style="text-decoration:none;display:block;padding:12px 14px;color:inherit;">
            ${logoHtml}
            ${discountPctHtml}
            ${priceRowHtml}
            ${ahorroHtml}
            ${desdeLabelHtml}
            ${priceTagHtml}
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:600;color:rgba(255,255,255,0.9);margin-top:6px;line-height:1.4;word-break:break-word;overflow-wrap:break-word;">${name}</div>
            ${ctaHtml}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
