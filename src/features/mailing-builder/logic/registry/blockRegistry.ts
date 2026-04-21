/**
 * Block Registry — fuente de verdad para cada tipo de bloque.
 *
 * Cada entrada de la registry es una BlockDefinition auto-contenida que
 * describe TODO lo que el sistema necesita saber sobre un bloque:
 *   - schema tipado (defaultProps + defaultLayout)
 *   - factory create() generada automáticamente
 *   - componente React de canvas (View)
 *   - componente React de inspector (Inspector)
 *   - función de render HTML email-safe (renderHtml)
 *
 * Para agregar un nuevo bloque:
 *   1. Añade el tipo en block.types.ts
 *   2. Añade una entrada a blockRegistry usando defineBlock<TuBloque>()
 *   → Sin tocar renderMailingHtml.ts, createBlock.ts ni ningún otro archivo.
 */

import type { ComponentType } from "react";
import type { BlockLayout } from "../schema/layout.types";
import type {
  ButtonBlock,
  HeroBlock,
  ImageBlock,
  MailingBlock,
  MailingBlockType,
  ProductBlock,
  SpacerBlock,
  TextBlock,
} from "../schema/block.types";
import type { MailingDocument } from "../schema/mailing.types";
import {
  FALLBACK_COLORS,
  buildTrackedUrl,
  escapeHtml,
  wrapBlock,
} from "../render/renderUtils";
import {
  ButtonBlockInspector,
  HeroBlockInspector,
  ImageBlockInspector,
  ProductBlockInspector,
  SpacerBlockInspector,
  TextBlockInspector,
} from "../../ui/blocks/MailingBlockInspectors";
import {
  ButtonBlockView,
  HeroBlockView,
  ImageBlockView,
  ProductBlockView,
  SpacerBlockView,
  TextBlockView,
} from "../../ui/blocks/MailingBlockViews";
import { productTemplate } from "../render/templates/block/product.template";
import { brandThemes } from "../brands/brandThemes";

// ---------------------------------------------------------------------------
// Tipos del contrato de definición de bloque
// ---------------------------------------------------------------------------

type BlockViewProps<TBlock extends MailingBlock = MailingBlock> = {
  block: TBlock;
  isSelected?: boolean;
  onChange?: (nextBlock: TBlock) => void;
};

type BlockInspectorProps<TBlock extends MailingBlock = MailingBlock> = {
  block: TBlock;
  onChange: (nextBlock: TBlock) => void;
};

/**
 * Contrato completo de un bloque. TBlock es el tipo concreto (HeroBlock, etc.)
 * El campo create() es generado automáticamente por defineBlock() y nunca
 * se duplican los defaults.
 */
export interface BlockDefinition<TBlock extends MailingBlock = MailingBlock> {
  /** Discriminador — coincide con TBlock["type"]. */
  type: TBlock["type"];
  label: string;
  category: "content" | "media" | "layout";
  /** Props por defecto al crear un bloque nuevo. */
  defaultProps: TBlock["props"];
  /** Layout por defecto al crear un bloque nuevo. */
  defaultLayout: BlockLayout;
  /** Factory — generada por defineBlock(); no definir manualmente. */
  create: () => TBlock;
  /** Componente React para el canvas de edición. */
  View: ComponentType<BlockViewProps<TBlock>>;
  /** Componente React para el panel de inspección. */
  Inspector: ComponentType<BlockInspectorProps<TBlock>>;
  /**
   * Convierte el bloque a HTML email-safe.
   * No importa React — es puro string interpolation.
   * Recibe el documento completo para resolver tracking UTM.
   */
  renderHtml: (block: TBlock, document: MailingDocument) => string;
}

/**
 * Tipo del mapa completo de la registry.
 * Garantiza que blockRegistry["hero"] sea BlockDefinition<HeroBlock>, etc.
 */
export type BlockRegistryMap = {
  [K in MailingBlockType]: BlockDefinition<Extract<MailingBlock, { type: K }>>;
};

// ---------------------------------------------------------------------------
// Factory helper — genera create() sin duplicar los defaults
// ---------------------------------------------------------------------------

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function defineBlock<TBlock extends MailingBlock>(
  def: Omit<BlockDefinition<TBlock>, "create">,
): BlockDefinition<TBlock> {
  return {
    ...def,
    create: (): TBlock =>
      ({
        id: createId(def.type),
        type: def.type,
        props: structuredClone(def.defaultProps),
        layout: structuredClone(def.defaultLayout),
      }) as TBlock,
  };
}

// ---------------------------------------------------------------------------
// Registry — una entrada por tipo de bloque
// ---------------------------------------------------------------------------

export const blockRegistry: BlockRegistryMap = {
  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: defineBlock<HeroBlock>({
    type: "hero",
    label: "Hero",
    category: "content",
    defaultProps: {
      title: "Nuevo Hero",
      subtitle: "Describe la campaña principal",
      imageUrl: "",
      ctaLabel: "Ver más",
      href: "",
    },
    defaultLayout: { colSpan: 12, padding: { bottom: 16 } },
    View: HeroBlockView,
    Inspector: HeroBlockInspector,
    renderHtml: (block, doc) => {
      const title = escapeHtml(block.props.title);
      const subtitle = block.props.subtitle
        ? `<p style="margin:0; font-size:16px; line-height:24px; color:${FALLBACK_COLORS.muted};">${escapeHtml(block.props.subtitle)}</p>`
        : "";
      const cta = block.props.ctaLabel
        ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
            <tr>
              <td bgcolor="${FALLBACK_COLORS.primary}" style="border-radius:6px;">
                <a href="${escapeHtml(buildTrackedUrl(block.props.href, doc))}"
                   style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:${FALLBACK_COLORS.primaryForeground}; text-decoration:none;">
                  ${escapeHtml(block.props.ctaLabel)}
                </a>
              </td>
            </tr>
          </table>`
        : "";

      return wrapBlock(
        block,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <img src="${escapeHtml(block.props.imageUrl || "/placeholder.svg")}" alt="${title}"
                   width="100%" style="display:block; width:100%; height:auto; border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;">
              <h1 style="margin:0 0 12px; font-size:32px; line-height:36px; font-weight:700; color:${FALLBACK_COLORS.foreground};">${title}</h1>
              ${subtitle}
              ${cta}
            </td>
          </tr>
        </table>`,
      );
    },
  }),

  // ── Text ──────────────────────────────────────────────────────────────────
  text: defineBlock<TextBlock>({
    type: "text",
    label: "Texto",
    category: "content",
    defaultProps: {
      html: "<p>Escribe tu contenido aquí</p>",
      align: "left",
      fontSize: 16,
      lineHeight: 1.4,
    },
    defaultLayout: { colSpan: 12, padding: { top: 12, right: 24, bottom: 12, left: 24 } },
    View: TextBlockView,
    Inspector: TextBlockInspector,
    renderHtml: (block) =>
      wrapBlock(
        block,
        `<div style="font-size:${block.props.fontSize ?? 16}px; line-height:${block.props.lineHeight ?? 1.4}; color:${FALLBACK_COLORS.foreground}; text-align:${block.props.align ?? "left"};">
          ${block.props.html}
        </div>`,
      ),
  }),

  // ── Image ─────────────────────────────────────────────────────────────────
  image: defineBlock<ImageBlock>({
    type: "image",
    label: "Imagen",
    category: "media",
    defaultProps: { src: "", alt: "", href: "" },
    defaultLayout: { colSpan: 12, padding: { bottom: 16 } },
    View: ImageBlockView,
    Inspector: ImageBlockInspector,
    renderHtml: (block, doc) => {
      const img = `<img src="${escapeHtml(block.props.src || "/placeholder.svg")}"
                        alt="${escapeHtml(block.props.alt || "Imagen")}"
                        width="100%" style="display:block; width:100%; height:auto; border:0;" />`;
      const content = block.props.href
        ? `<a href="${escapeHtml(buildTrackedUrl(block.props.href, doc))}" style="text-decoration:none;">${img}</a>`
        : img;
      return wrapBlock(block, content);
    },
  }),

  // ── Button ────────────────────────────────────────────────────────────────
  button: defineBlock<ButtonBlock>({
    type: "button",
    label: "Botón",
    category: "content",
    defaultProps: { label: "Botón CTA", href: "", align: "center" },
    defaultLayout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 8, left: 24 } },
    View: ButtonBlockView,
    Inspector: ButtonBlockInspector,
    renderHtml: (block, doc) => {
      const align = block.props.align === "left" ? "left" : block.props.align === "right" ? "right" : "center";
      return wrapBlock(
        block,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="${align}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${FALLBACK_COLORS.primary}" style="border-radius:6px;">
                    <a href="${escapeHtml(buildTrackedUrl(block.props.href, doc))}"
                       style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:${FALLBACK_COLORS.primaryForeground}; text-decoration:none;">
                      ${escapeHtml(block.props.label)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
      );
    },
  }),

  // ── Spacer ────────────────────────────────────────────────────────────────
  spacer: defineBlock<SpacerBlock>({
    type: "spacer",
    label: "Espaciador",
    category: "layout",
    defaultProps: { height: 24 },
    defaultLayout: { colSpan: 12 },
    View: SpacerBlockView,
    Inspector: SpacerBlockInspector,
    renderHtml: (block) =>
      wrapBlock(
        block,
        `<div style="line-height:${block.props.height}px; height:${block.props.height}px;">&nbsp;</div>`,
        "transparent",
      ),
  }),

  // ── Product ───────────────────────────────────────────────────────────────
  product: defineBlock<ProductBlock>({
    type: "product",
    label: "Producto",
    category: "content",
    defaultProps: {
      imageUrl: "",
      name: "Nombre del producto",
      brand: "",
      price: "$ 9.990",
      unit: "c/u",
      href: "",
      ctaLabel: "Agregar",
    },
    defaultLayout: { colSpan: 4, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    View: ProductBlockView,
    Inspector: ProductBlockInspector,
    renderHtml: (block, doc) => {
      const brandId = doc.settings.brand;
      const theme = brandId ? brandThemes[brandId] : undefined;
      const padding = {
        top:    block.layout.padding?.top    ?? 0,
        right:  block.layout.padding?.right  ?? 0,
        bottom: block.layout.padding?.bottom ?? 0,
        left:   block.layout.padding?.left   ?? 0,
      };
      return productTemplate({
        padding,
        bgColor:          block.layout.backgroundColor ?? "transparent",
        imageUrl:         escapeHtml(block.props.imageUrl || "/placeholder.svg"),
        name:             escapeHtml(block.props.name),
        brand:            escapeHtml(block.props.brand ?? ""),
        price:            escapeHtml(block.props.price),
        unit:             escapeHtml(block.props.unit ?? ""),
        href:             escapeHtml(buildTrackedUrl(block.props.href, doc)),
        ctaLabel:         escapeHtml(block.props.ctaLabel ?? "Agregar"),
        primaryColor:     theme?.primaryColor          ?? FALLBACK_COLORS.primary,
        primaryForeground: theme?.primaryForeground    ?? FALLBACK_COLORS.primaryForeground,
      });
    },
  }),
};
