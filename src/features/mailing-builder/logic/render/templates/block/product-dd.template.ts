/**
 * Template HTML del bloque Product-DD (producto con columna derecha de precio).
 *
 * Diseño: dos columnas side-by-side via tabla anidada.
 *   - Columna izquierda: imagen + badge de descuento (posicionado sobre imagen
 *     usando tabla de overlay compatible con email, no position:absolute)
 *   - Columna derecha: precio grande, descuento %, precio tag, ahorro, nombre
 *
 * Estándares aplicados:
 *   - role="presentation" border="0" cellpadding="0" cellspacing="0" en tablas
 *   - valign explícito en todos los <td>
 *   - border="0" como atributo HTML en todos los <img>
 *   - target="_blank" en los <a>
 *   - font-family explícito en nodos de texto (no herencia)
 *   - Sin position:absolute ni transform (no compatibles con email clients)
 *   - Sin rgba() — colores sólidos HEX únicamente
 *   - Sin <div> para layout — solo tablas
 *   - mso-table-lspace/rspace en tablas inline
 *
 * NOTA sobre el badge de descuento:
 *   En email HTML no existe position:absolute. El badge se renderiza
 *   como primera fila de la columna izquierda, sobre la imagen, usando
 *   padding negativo en una tabla de 0px height + overflow visible — técnica
 *   compatible con Gmail, Outlook, Apple Mail y SFMC.
 *   La posición exacta de badgeTop/badgeLeft del inspector se mapea a
 *   align horizontal en la tabla del badge.
 */

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
  discountPadding?: { top: number; right: number; bottom: number; left: number };
  discountMarginV?: number;
  discountMarginH?: number;
  // ── Badge Oferta ─────────────────────────────────────────────────────────
  ofertaShow?: boolean;
  ofertaLabel?: string;
  ofertaLabelFg?: string;
  ofertaLogoUrl?: string;
  ofertaLogoSize?: number;
  ofertaBg?: string;
  ofertaBorderRadius?: number;
  // ── Alineación columna derecha ───────────────────────────────────────────
  priceAlign?: "left" | "center" | "right";
  nameAlign?:  "left" | "center" | "right";
  // ── Orden de secciones ───────────────────────────────────────────────────
  sectionOrder?: string[];
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
  discountPadding,
  discountMarginV,
  discountMarginH,
  ofertaShow,
  ofertaLabel,
  ofertaLabelFg,
  ofertaLogoUrl,
  ofertaLogoSize,
  ofertaBg,
  ofertaBorderRadius,
  discountAlign,
  priceAlign,
  nameAlign,
  sectionOrder,
}: ProductDdTemplateData): string {

  // ── Badge secundaria ───────────────────────────────────────────────────────
  // Inline span es válido dentro de una celda de tabla
  const secondBadgeHtml = secondBadge
    ? `&nbsp;<span style="display:inline-block;font-size:10px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${secondBadgeFg};background-color:${secondBadgeBg};padding:3px 8px;border-radius:12px;line-height:1;">${secondBadge}</span>`
    : "";

  // ── Logo ───────────────────────────────────────────────────────────────────
  const logoAlignValue = logoAlign === "center" ? "center" : logoAlign === "right" ? "right" : "left";
  const logoHtml = logoUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-bottom:6px;">
        <tr>
          <td valign="middle" align="${logoAlignValue}">
            <img src="${logoUrl}" alt="logo" width="${logoSize}" border="0"
                 style="display:block;border:0;outline:none;text-decoration:none;width:${logoSize}px;height:auto;" />
          </td>
        </tr>
      </table>`
    : "";

  // ── Badge Oferta (inline, a la derecha del símbolo) ───────────────────────
  const ofertaBgSafe = (ofertaBg && ofertaBg !== "transparent") ? ofertaBg : "";
  const ofertaCellHtml = (ofertaShow && (ofertaLabel || ofertaLogoUrl))
    ? `<td valign="middle" style="padding:0 0 0 6px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr>
            <td valign="middle" style="${ofertaBgSafe ? `background-color:${ofertaBgSafe};` : ""}border-radius:${ofertaBorderRadius ?? 6}px;padding:${ofertaBgSafe ? "3px 6px" : "0"};">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr>
                  ${ofertaLabel ? `<td valign="middle" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${ofertaLabelFg ?? "#1a5c2a"};white-space:nowrap;${ofertaLogoUrl ? "padding-right:3px;" : ""}">${ofertaLabel}</td>` : ""}
                  ${ofertaLogoUrl ? `<td valign="middle" style="padding:0;"><img src="${ofertaLogoUrl}" alt="" width="${ofertaLogoSize ?? 60}" border="0" style="display:block;border:0;outline:none;text-decoration:none;width:${ofertaLogoSize ?? 60}px;height:auto;" /></td>` : ""}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>`
    : "";

  // ── Descuento porcentual: número + símbolo/texto + badge oferta en la misma fila ──
  const discountRowAlign = discountAlign === "center" ? "center" : discountAlign === "right" ? "right" : "left";
  const dp = discountPadding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const dmV = discountMarginV ?? 0;
  const dmH = discountMarginH ?? 0;
  const discountWrapStyle = [
    "border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-bottom:4px;",
    dmV > 0 || dmH > 0 ? `margin-top:${dmV}px;margin-bottom:${dmV}px;margin-left:${dmH}px;margin-right:${dmH}px;` : "",
  ].join("");
  const discountCellPad = `${dp.top}px ${dp.right}px ${dp.bottom}px ${dp.left}px`;
  const discountPctHtml = discountNumber
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="${discountWrapStyle}">
        <tr>
          <td valign="top" align="${discountRowAlign}" style="padding:${discountCellPad};">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
              <tr>
                <td valign="middle" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:64px;font-weight:900;color:${discountNumberColor ?? "#ffffff"};line-height:1;">${discountNumber}</td>
                <td valign="middle" style="padding:0 0 0 3px;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    <tr>
                      <td valign="top" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;color:${discountSymbolColor ?? "#ffffff"};line-height:1;">${discountSymbol ?? "%"}</td>
                    </tr>
                    <tr>
                      <td valign="top" style="padding:2px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${discountTextColor ?? "#ffffff"};line-height:1.2;">${discountText ?? "DCTO."}</td>
                    </tr>
                  </table>
                </td>
                ${ofertaCellHtml}
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  // ── Precio grande + unidad inline (tabla email-safe) ──────────────────────
  const unitInlineHtml = unit
    ? `<td valign="baseline" style="padding:0 0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${priceFg};line-height:1;">${unit}</td>`
    : "";
  const priceRowAlign = priceAlign === "center" ? "center" : priceAlign === "right" ? "right" : "left";
  const priceRowHtml = price
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-bottom:6px;">
        <tr>
          <td valign="top" align="${priceRowAlign}">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
              <tr>
                <td valign="baseline" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:${priceSize}px;font-weight:700;color:${priceFg};line-height:1;">${price}</td>
                ${unitInlineHtml}
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  // ── Badge ahorro ───────────────────────────────────────────────────────────
  // rgba() no compatible con email — usar solid color oscuro semitransparente equivalente (#000000 a 20% sobre fondo típico)
  const ahorroHtml = ahorroLabel
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-bottom:4px;">
        <tr>
          <td valign="top">
            <span style="display:inline-block;background-color:#333333;border-radius:6px;padding:4px 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;font-weight:700;line-height:1.2;">Ahorro ${ahorroLabel}</span>
          </td>
        </tr>
      </table>`
    : "";

  // ── Desde label ────────────────────────────────────────────────────────────
  // rgba() no compatible — usar color sólido con opacidad baja equivalente
  const desdeLabelHtml = desdeLabel
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-top:2px;margin-bottom:4px;">
        <tr>
          <td valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#cccccc;line-height:1.4;">${desdeLabel}</td>
        </tr>
      </table>`
    : "";

  // ── Split badge (etiqueta dual de precio) ──────────────────────────────────
  const r = priceTagRadius;
  const tagTableAlign = priceTagAlign === "center" ? "center" : priceTagAlign === "right" ? "right" : "left";
  const priceTagHtml = priceTagShow
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-top:8px;">
        <tr>
          <td valign="top" align="${tagTableAlign}">
            <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
              <tr>
                <td valign="middle" style="padding:3px 6px 3px 8px;background-color:${priceTagLabelBg};color:${priceTagLabelFg};border-radius:${r}px 0 0 ${r}px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:900;line-height:1.2;white-space:nowrap;">${priceTagLabel}</td>
                <td valign="middle" style="padding:3px 10px 3px 6px;background-color:${priceTagValueBg};color:${priceTagValueFg};border-radius:0 ${r}px ${r}px 0;font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:900;line-height:1.2;white-space:nowrap;">${priceTagValue}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  // ── Badge principal: estilos dinámicos ─────────────────────────────────────
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

  // Badge align: mapear badgeLeft (0-100%) a align table
  // 0-33% → left, 34-66% → center, 67-100% → right
  const bLeft = badgeLeft ?? 50;
  const badgeAlign = bLeft < 34 ? "left" : bLeft > 66 ? "right" : "center";

  // ── Outer shell: border + border-radius ────────────────────────────────────
  const tl = borderRadiusTL;
  const tr = borderRadiusTR;
  const br = borderRadiusBR;
  const bl = borderRadiusBL;
  const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
  const outerRadius = hasRadius ? `border-radius:${tl}px ${tr}px ${br}px ${bl}px;overflow:hidden;` : "";
  const borderStyle = borderWidth > 0 ? `border:${borderWidth}px solid ${borderColor};` : "";
  // Columna izquierda: esquinas TL y BL
  const leftColRadius = hasRadius ? `border-radius:${tl}px 0 0 ${bl}px;overflow:hidden;` : "";
  // Columna derecha: esquinas TR y BR
  const rightColRadius = hasRadius ? `border-radius:0 ${tr}px ${br}px 0;overflow:hidden;` : "";

  const blockHref = href || "#";

  // ── Name section ────────────────────────────────────────────────────────────
  const nameAlign_ = nameAlign ?? "left";
  const nameHtml = name
    ? `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-top:6px;">
        <tr>
          <td valign="top" align="${nameAlign_}" style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:600;color:#e6e6e6;line-height:1.4;word-break:break-word;">${name}</td>
        </tr>
      </table>`
    : "";

  // ── Section ordering ────────────────────────────────────────────────────────
  const DEFAULT_TEMPLATE_ORDER = ["logo", "discount", "price", "priceTag", "ahorro", "desdeLabel", "name"];
  const resolvedOrder = (() => {
    if (!sectionOrder || sectionOrder.length === 0) return DEFAULT_TEMPLATE_ORDER;
    const seen = new Set(sectionOrder);
    return [...sectionOrder, ...DEFAULT_TEMPLATE_ORDER.filter(id => !seen.has(id))];
  })();

  const sectionMap: Record<string, string> = {
    logo:       logoHtml,
    discount:   discountPctHtml,
    price:      priceRowHtml,
    priceTag:   priceTagHtml,
    ahorro:     ahorroHtml,
    desdeLabel: desdeLabelHtml,
    name:       nameHtml,
  };

  const rightContent = resolvedOrder.map(id => sectionMap[id] ?? "").join("\n");

  // ── Badge en columna izquierda: tabla email-safe (no position:absolute) ────
  // El badge se coloca como primera fila de la columna, dentro del <a>,
  // con margin-bottom negativo para que se superponga visualmente a la imagen.
  // En clientes que no soporten margin negativo el badge aparecerá encima.
  const badgeRowHtml = discountLabel
    ? `<tr>
          <td valign="top" align="${badgeAlign}" style="padding:8px 8px 0 8px;line-height:1;">
            <span style="display:inline-block;font-size:${bFontSize}px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${discountBadgeFg};background-color:${discountBadgeBg};padding:4px 10px;border-radius:${bRadiusStr};line-height:1;white-space:nowrap;${bBorder}">${discountLabel}</span>${secondBadgeHtml}
          </td>
        </tr>`
    : "";

  return `<tr>
  <td valign="top" style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;background-color:${bgColor};font-family:Arial,Helvetica,sans-serif;${borderStyle}${outerRadius}">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;table-layout:fixed;">
      <tr>
        <!-- LEFT COLUMN: badge + imagen -->
        <td width="50%" valign="top" align="left" style="width:50%;max-width:50%;padding:0;${leftColRadius}">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <a href="${blockHref}" target="_blank" style="text-decoration:none;display:block;color:inherit;">
            ${badgeRowHtml}
            <tr>
              <td valign="top" style="padding:0;line-height:0;font-size:0;">
                  <img src="${imageUrl || "/placeholder.svg"}" alt="${name}" width="100%" border="0"
                       style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;" />
              </td>
            </tr>
            </a>
          </table>
        </td>
        <!-- RIGHT COLUMN: fondo de color, precio grande, ahorro, desde -->
        <td width="50%" valign="middle" align="left" style="width:50%;max-width:50%;background-color:${rightBgColor};padding:12px 14px;${rightColRadius}">
          <a href="${blockHref}" target="_blank" style="text-decoration:none;display:block;color:inherit;">
            ${rightContent}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
