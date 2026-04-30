/**
 * RenderEngine — punto de entrada unificado para la generación de HTML email-safe.
 *
 * GARANTÍA DE CONSISTENCIA:
 *   Tanto el preview del cliente como el export del servidor usan
 *   `defaultRenderEngine.render(document)`. El output es idéntico en
 *   browser y en Node porque este módulo NO tiene dependencias de DOM.
 *
 * USO:
 *   // Cliente (React)
 *   const html = useMemo(() => defaultRenderEngine.render(document), [document]);
 *
 *   // Servidor (Vercel Edge / Node)
 *   const html = defaultRenderEngine.render(parsedDocument);
 */

import type { MailingDocument } from "../schema/mailing.types";
import type { MailingBlock } from "../schema/block.types";
import type { MailingColumn, MailingRow } from "../schema/row.types";
import {
  FALLBACK_COLORS,
  buildTrackedUrl,
  escapeHtml,
  escapeHref,
  getBlockPadding,
  getBlockRadii,
  resolveColor,
} from "./renderUtils";
import { documentTemplate } from "./templates/document.template";
import { brandThemes } from "../brands/brandThemes";
import { brandShells } from "../brands/brandShells";
import { rowTemplate, columnTemplate } from "./templates/row.template";
import { heroTemplate } from "./templates/block/hero.template";
import { textTemplate } from "./templates/block/text.template";
import { imageTemplate } from "./templates/block/image.template";
import { buttonTemplate } from "./templates/block/button.template";
import { spacerTemplate } from "./templates/block/spacer.template";
import { productTemplate } from "./templates/block/product.template";
import { productDdTemplate } from "./templates/block/product-dd.template";
import type { HeroBlock, TextBlock, ImageBlock, ButtonBlock, SpacerBlock, ProductBlock, ProductDdBlock, RawHtmlBlock } from "../schema/block.types";

// ---------------------------------------------------------------------------
// Preparadores de datos por bloque (lógica ≠ template)
// ---------------------------------------------------------------------------

function prepareHero(
  block: HeroBlock,
  doc: MailingDocument,
  brandColors?: { primary: string; primaryForeground: string },
): ReturnType<typeof heroTemplate> {
  return heroTemplate({
    padding:   getBlockPadding(block),
    bgColor:   resolveColor(block.layout.backgroundColor, "transparent"),
    imageUrl:  escapeHref(block.props.imageUrl || "/placeholder.svg"),
    imageAlt:  escapeHtml(block.props.title),
    title:     escapeHtml(block.props.title),
    subtitle:  block.props.subtitle ? escapeHtml(block.props.subtitle) : "",
    ctaLabel:  block.props.ctaLabel ? escapeHtml(block.props.ctaLabel) : "",
    ctaHref:   block.props.ctaLabel ? escapeHref(buildTrackedUrl(block.props.href, doc)) : "#",
    colors: {
      foreground:        FALLBACK_COLORS.foreground,
      muted:             FALLBACK_COLORS.muted,
      primary:           brandColors?.primary          ?? FALLBACK_COLORS.primary,
      primaryForeground: brandColors?.primaryForeground ?? FALLBACK_COLORS.primaryForeground,
    },
  });
}

function prepareText(block: TextBlock): ReturnType<typeof textTemplate> {
  return textTemplate({
    padding:    getBlockPadding(block),
    bgColor:    resolveColor(block.layout.backgroundColor, "transparent"),
    html:       block.props.html,              // el usuario es responsable del contenido HTML
    align:      block.props.align   ?? "left",
    fontSize:   block.props.fontSize ?? 16,
    lineHeight: block.props.lineHeight ?? 24,
    color:      FALLBACK_COLORS.foreground,
  });
}

function prepareImage(block: ImageBlock, doc: MailingDocument): ReturnType<typeof imageTemplate> {
  return imageTemplate({
    padding: getBlockPadding(block),
    bgColor: resolveColor(block.layout.backgroundColor, "transparent"),
    src:     escapeHref(block.props.src  || "/placeholder.svg"),
    alt:     escapeHtml(block.props.alt  || "Imagen"),
    href:    block.props.href ? escapeHref(buildTrackedUrl(block.props.href, doc)) : "",
  });
}

function prepareButton(
  block: ButtonBlock,
  doc: MailingDocument,
  brandColors?: { primary: string; primaryForeground: string },
): ReturnType<typeof buttonTemplate> {
  const raw = block.props.align ?? "center";
  const align = raw === "left" || raw === "right" ? raw : "center";
  return buttonTemplate({
    padding: getBlockPadding(block),
    bgColor: resolveColor(block.layout.backgroundColor, "transparent"),
    label:   escapeHtml(block.props.label),
    href:    escapeHref(buildTrackedUrl(block.props.href, doc)),
    align,
    colors: {
      primary:           brandColors?.primary          ?? FALLBACK_COLORS.primary,
      primaryForeground: brandColors?.primaryForeground ?? FALLBACK_COLORS.primaryForeground,
    },
  });
}

function prepareSpacer(block: SpacerBlock): ReturnType<typeof spacerTemplate> {
  return spacerTemplate({ height: block.props.height });
}

function prepareProduct(
  block: ProductBlock,
  doc: MailingDocument,
  brandColors?: { primary: string; primaryForeground: string },
): ReturnType<typeof productTemplate> {
  return productTemplate({
    padding:          getBlockPadding(block),
    bgColor:          resolveColor(block.layout.backgroundColor, "transparent"),
    imageUrl:         escapeHref(block.props.imageUrl || "/placeholder.svg"),
    name:             escapeHtml(block.props.name),
    brand:            escapeHtml(block.props.brand ?? ""),
    price:            escapeHtml(block.props.price),
    unit:             escapeHtml(block.props.unit ?? ""),
    href:             escapeHref(buildTrackedUrl(block.props.href, doc)),
    ctaLabel:         escapeHtml(block.props.ctaLabel ?? "Agregar"),
    primaryColor:     brandColors?.primary          ?? FALLBACK_COLORS.primary,
    primaryForeground: brandColors?.primaryForeground ?? FALLBACK_COLORS.primaryForeground,
  });
}

function prepareProductDd(
  block: ProductDdBlock,
  doc: MailingDocument,
  brandColors?: { primary: string; primaryForeground: string },
): ReturnType<typeof productDdTemplate> {
  return productDdTemplate({
    padding:          getBlockPadding(block),
    bgColor:          resolveColor(block.layout.backgroundColor, "#ffffff"),
    borderRadius:     block.layout.borderRadius ?? 0,
    ...(() => { const rc = getBlockRadii(block); return { borderRadiusTL: rc.tl, borderRadiusTR: rc.tr, borderRadiusBR: rc.br, borderRadiusBL: rc.bl }; })(),
    borderWidth:      block.layout.borderWidth  ?? 0,
    borderColor:      block.layout.borderColor  ?? "#e5e7eb",
    imageUrl:         escapeHref(block.props.imageUrl || "/placeholder.svg"),
    imageAlt:         escapeHtml(block.props.imageAlt ?? block.props.name ?? ""),
    imageWidth:       block.props.imageWidth       ?? 100,
    imageAlign:       block.props.imageAlign       ?? "left",
    imageRadius:      block.props.imageRadius      ?? 0,
    imagePadding:     block.props.imagePadding     ?? { top: 0, right: 0, bottom: 0, left: 0 },
    imageMarginV:     block.props.imageMarginV     ?? 0,
    imageMarginH:     block.props.imageMarginH     ?? 0,
    imageBorderWidth: block.props.imageBorderWidth ?? 0,
    imageBorderColor: block.props.imageBorderColor ?? "#e5e7eb",
    imageHref:        block.props.imageHref ? escapeHref(buildTrackedUrl(block.props.imageHref, doc)) : "",
    discountLabel:    escapeHtml(block.props.discountLabel),
    discountBadgeBg:  block.props.discountBadgeBg,
    discountBadgeFg:  block.props.discountBadgeFg,
    badgeTop:         block.props.badgeTop          ?? 10,
    badgeLeft:        block.props.badgeLeft         ?? 50,
    badgeFontSize:    block.props.badgeFontSize     ?? 12,
    badgeBorderRadius: block.props.badgeBorderRadius ?? 20,
    badgeRadiusTL:    block.props.badgeRadiusTL,
    badgeRadiusTR:    block.props.badgeRadiusTR,
    badgeRadiusBR:    block.props.badgeRadiusBR,
    badgeRadiusBL:    block.props.badgeRadiusBL,
    badgeBorderWidth: block.props.badgeBorderWidth  ?? 0,
    badgeBorderColor: block.props.badgeBorderColor  ?? "#000000",
    secondBadge:      escapeHtml(block.props.secondBadge ?? ""),
    secondBadgeBg:    block.props.secondBadgeBg ?? "#F97316",
    secondBadgeFg:    block.props.secondBadgeFg ?? "#FFFFFF",
    originalPrice:    block.props.originalPrice,
    price:            block.props.price,
    priceColor:       block.props.priceColor,
    name:             block.props.name,
    brand:            block.props.brand ?? "",
    unit:             escapeHtml(block.props.unit ?? ""),
    logoUrl:          block.props.logoShow !== false ? escapeHref(block.props.logoUrl ?? "") : "",
    logoSize:         block.props.logoSize ?? 60,
    logoAlign:        block.props.logoAlign ?? "left",
    href:             escapeHref(buildTrackedUrl(block.props.href, doc)),
    ctaLabel:         escapeHtml(block.props.ctaLabel ?? "Agregar"),
    primaryColor:     brandColors?.primary           ?? FALLBACK_COLORS.primary,
    primaryForeground: brandColors?.primaryForeground ?? FALLBACK_COLORS.primaryForeground,
    rightBgColor:     block.props.rightBgColor  ?? "#3DBE4A",
    priceSize:        block.props.priceSize      ?? 50,
    priceFg:          block.props.priceFg        ?? "#ffffff",
    ahorroLabel:      escapeHtml(block.props.ahorroLabel ?? ""),
    desdeLabel:       escapeHtml(block.props.desdeLabel  ?? ""),
    priceTagShow:    block.props.priceTagShow    ?? false,
    priceTagLabel:   escapeHtml(block.props.priceTagLabel   ?? "Ahorro"),
    priceTagLabelBg: block.props.priceTagLabelBg ?? "#ffffff",
    priceTagLabelFg: block.props.priceTagLabelFg ?? "#23af3d",
    priceTagValue:   escapeHtml(block.props.priceTagValue   ?? "$ 1.640"),
    priceTagValueBg: block.props.priceTagValueBg ?? "#000000",
    priceTagValueFg: block.props.priceTagValueFg ?? "#ffffff",
    priceTagRadius:  block.props.priceTagRadius  ?? 10,
    priceTagAlign:   block.props.priceTagAlign   ?? "left",
    discountNumber:      escapeHtml(block.props.discountNumber      ?? ""),
    discountNumberColor: block.props.discountNumberColor ?? "#ffffff",
    discountSymbol:      escapeHtml(block.props.discountSymbol      ?? "%"),
    discountSymbolColor: block.props.discountSymbolColor ?? "#ffffff",
    discountText:        escapeHtml(block.props.discountText        ?? "DCTO."),
    discountTextColor:   block.props.discountTextColor   ?? "#ffffff",
    discountAlign:       block.props.discountAlign       ?? "left",
    discountPadding:     block.props.discountPadding     ?? { top: 0, right: 0, bottom: 0, left: 0 },
    discountMarginV:     block.props.discountMarginV     ?? 0,
    discountMarginH:     block.props.discountMarginH     ?? 0,
    pricePadding:        block.props.pricePadding        ?? { top: 0, right: 0, bottom: 0, left: 0 },
    priceMarginV:        block.props.priceMarginV        ?? 0,
    priceMarginH:        block.props.priceMarginH        ?? 0,
    namePadding:         block.props.namePadding         ?? { top: 0, right: 0, bottom: 0, left: 0 },
    nameMarginV:         block.props.nameMarginV         ?? 0,
    nameMarginH:         block.props.nameMarginH         ?? 0,
    ofertaShow:          block.props.ofertaShow          ?? false,
    ofertaLabel:         escapeHtml(block.props.ofertaLabel         ?? ""),
    ofertaLabelFg:       block.props.ofertaLabelFg       ?? "#1a5c2a",
    ofertaLogoUrl:       escapeHtml(block.props.ofertaLogoUrl       ?? ""),
    ofertaLogoSize:      block.props.ofertaLogoSize      ?? 80,
    ofertaBg:            block.props.ofertaBg            ?? "transparent",
    ofertaBorderRadius:  block.props.ofertaBorderRadius  ?? 6,
    sectionOrder:        block.props.sectionOrder,
    priceAlign:          block.props.priceAlign  ?? "left",
    nameAlign:           block.props.nameAlign   ?? "left",
  });
}

// ---------------------------------------------------------------------------
// RenderEngine
// ---------------------------------------------------------------------------

export class RenderEngine {
  /**
   * Renderiza un bloque individual a HTML email-safe.
   * Delega en el preparador de datos + template correspondiente.
   */
  renderBlock(
    block: MailingBlock,
    doc: MailingDocument,
    brandColors?: { primary: string; primaryForeground: string },
  ): string {
    switch (block.type) {
      case "hero":    return prepareHero(block, doc, brandColors);
      case "text":    return prepareText(block);
      case "image":   return prepareImage(block, doc);
      case "button":  return prepareButton(block, doc, brandColors);
      case "spacer":  return prepareSpacer(block);
      case "product":    return prepareProduct(block, doc, brandColors);
      case "product-dd": return prepareProductDd(block, doc, brandColors);
      case "raw-html":   return (block as RawHtmlBlock).props.html;
      default:
        return "";
    }
  }

  /** Renderiza una columna con sus bloques. */
  private renderColumn(
    col: MailingColumn,
    doc: MailingDocument,
    columnWidth: number,
    brandColors?: { primary: string; primaryForeground: string },
  ): string {
    const blocksHtml = col.blocks.map((b) => this.renderBlock(b, doc, brandColors)).join("\n");
    const colPad     = col.meta?.padding;
    return columnTemplate({
      columnWidth,
      colBg:       resolveColor(col.meta?.backgroundColor, "transparent"),
      colPadStyle: colPad
        ? `padding:${colPad.top ?? 0}px ${colPad.right ?? 0}px ${colPad.bottom ?? 0}px ${colPad.left ?? 0}px; `
        : "",
      blocksHtml,
    });
  }

  /** Renderiza una fila con sus columnas. */
  private renderRow(
    row: MailingRow,
    doc: MailingDocument,
    totalWidth: number,
    brandColors?: { primary: string; primaryForeground: string },
  ): string {
    const totalSpans = row.columns.reduce((s, c) => s + c.colSpan, 0);
    const columnsHtml = row.columns
      .map((col) => {
        const colWidth = Math.round((col.colSpan / totalSpans) * totalWidth);
        return this.renderColumn(col, doc, colWidth, brandColors);
      })
      .join("\n");

    const rowPad = row.meta?.padding;
    return rowTemplate({
      rowBg:       resolveColor(row.meta?.backgroundColor, "transparent"),
      rowPadStyle: rowPad
        ? `padding:${rowPad.top ?? 0}px ${rowPad.right ?? 0}px ${rowPad.bottom ?? 0}px ${rowPad.left ?? 0}px; `
        : "",
      totalWidth,
      columnsHtml,
    });
  }

  /**
   * Renderiza el documento completo a HTML email-safe.
   *
   * Este es el método que preview y export deben usar — misma función,
   * mismo output, sin divergencias.
   */
  render(doc: MailingDocument): string {
    const width = doc.settings.width;

    // Resolver brand si está configurado
    const brandId = doc.settings.brand;
    const theme = brandId ? brandThemes[brandId] : undefined;
    const shell = brandId ? brandShells[brandId] : undefined;

    const brandColors = theme
      ? { primary: theme.primaryColor, primaryForeground: theme.primaryForeground }
      : undefined;

    const rowsHtml = doc.rows.map((row) => this.renderRow(row, doc, width, brandColors)).join("\n");

    return documentTemplate({
      subject:       escapeHtml(doc.settings.subject || doc.name),
      preheader:     escapeHtml(doc.settings.preheader || ""),
      fontFamily:    theme?.fontFamily ?? doc.settings.fontFamily,
      bodyBg:        resolveColor(doc.settings.backgroundColor,        FALLBACK_COLORS.background),
      contentBg:     resolveColor(doc.settings.contentBackgroundColor, FALLBACK_COLORS.content),
      width,
      rowsHtml,
      brandCss:      shell?.css,
      brandHeader:   shell?.header,
      brandFooter:   shell?.footer,
      sfmcTracking:  shell?.sfmc,
    });
  }
}

/** Instancia compartida — cliente y servidor usan ESTA misma instancia. */
export const defaultRenderEngine = new RenderEngine();
