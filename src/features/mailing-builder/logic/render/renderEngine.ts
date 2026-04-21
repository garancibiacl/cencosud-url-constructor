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
  getBlockPadding,
  resolveColor,
} from "./renderUtils";
import { documentTemplate } from "./templates/document.template";
import { rowTemplate, columnTemplate } from "./templates/row.template";
import { heroTemplate } from "./templates/block/hero.template";
import { textTemplate } from "./templates/block/text.template";
import { imageTemplate } from "./templates/block/image.template";
import { buttonTemplate } from "./templates/block/button.template";
import { spacerTemplate } from "./templates/block/spacer.template";
import type { HeroBlock, TextBlock, ImageBlock, ButtonBlock, SpacerBlock } from "../schema/block.types";

// ---------------------------------------------------------------------------
// Preparadores de datos por bloque (lógica ≠ template)
// ---------------------------------------------------------------------------

function prepareHero(block: HeroBlock, doc: MailingDocument): ReturnType<typeof heroTemplate> {
  return heroTemplate({
    padding:   getBlockPadding(block),
    bgColor:   resolveColor(block.layout.backgroundColor, "transparent"),
    imageUrl:  escapeHtml(block.props.imageUrl || "/placeholder.svg"),
    imageAlt:  escapeHtml(block.props.title),
    title:     escapeHtml(block.props.title),
    subtitle:  block.props.subtitle ? escapeHtml(block.props.subtitle) : "",
    ctaLabel:  block.props.ctaLabel ? escapeHtml(block.props.ctaLabel) : "",
    ctaHref:   block.props.ctaLabel ? escapeHtml(buildTrackedUrl(block.props.href, doc)) : "#",
    colors: {
      foreground:       FALLBACK_COLORS.foreground,
      muted:            FALLBACK_COLORS.muted,
      primary:          FALLBACK_COLORS.primary,
      primaryForeground: FALLBACK_COLORS.primaryForeground,
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
    src:     escapeHtml(block.props.src  || "/placeholder.svg"),
    alt:     escapeHtml(block.props.alt  || "Imagen"),
    href:    block.props.href ? escapeHtml(buildTrackedUrl(block.props.href, doc)) : "",
  });
}

function prepareButton(block: ButtonBlock, doc: MailingDocument): ReturnType<typeof buttonTemplate> {
  const raw = block.props.align ?? "center";
  const align = raw === "left" || raw === "right" ? raw : "center";
  return buttonTemplate({
    padding: getBlockPadding(block),
    bgColor: resolveColor(block.layout.backgroundColor, "transparent"),
    label:   escapeHtml(block.props.label),
    href:    escapeHtml(buildTrackedUrl(block.props.href, doc)),
    align,
    colors: {
      primary:          FALLBACK_COLORS.primary,
      primaryForeground: FALLBACK_COLORS.primaryForeground,
    },
  });
}

function prepareSpacer(block: SpacerBlock): ReturnType<typeof spacerTemplate> {
  return spacerTemplate({ height: block.props.height });
}

// ---------------------------------------------------------------------------
// RenderEngine
// ---------------------------------------------------------------------------

export class RenderEngine {
  /**
   * Renderiza un bloque individual a HTML email-safe.
   * Delega en el preparador de datos + template correspondiente.
   */
  renderBlock(block: MailingBlock, doc: MailingDocument): string {
    switch (block.type) {
      case "hero":   return prepareHero(block, doc);
      case "text":   return prepareText(block);
      case "image":  return prepareImage(block, doc);
      case "button": return prepareButton(block, doc);
      case "spacer": return prepareSpacer(block);
      default:
        return "";
    }
  }

  /** Renderiza una columna con sus bloques. */
  private renderColumn(col: MailingColumn, doc: MailingDocument, columnWidth: number): string {
    const blocksHtml = col.blocks.map((b) => this.renderBlock(b, doc)).join("\n");
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
  private renderRow(row: MailingRow, doc: MailingDocument, totalWidth: number): string {
    const totalSpans = row.columns.reduce((s, c) => s + c.colSpan, 0);
    const columnsHtml = row.columns
      .map((col) => {
        const colWidth = Math.round((col.colSpan / totalSpans) * totalWidth);
        return this.renderColumn(col, doc, colWidth);
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
    const width     = doc.settings.width;
    const rowsHtml  = doc.rows.map((row) => this.renderRow(row, doc, width)).join("\n");

    return documentTemplate({
      subject:    escapeHtml(doc.settings.subject || doc.name),
      preheader:  escapeHtml(doc.settings.preheader || ""),
      fontFamily: doc.settings.fontFamily,
      bodyBg:     resolveColor(doc.settings.backgroundColor,        FALLBACK_COLORS.background),
      contentBg:  resolveColor(doc.settings.contentBackgroundColor, FALLBACK_COLORS.content),
      width,
      rowsHtml,
    });
  }
}

/** Instancia compartida — cliente y servidor usan ESTA misma instancia. */
export const defaultRenderEngine = new RenderEngine();
