import type { BlockLayout } from "./layout.types";

export type MailingBlockType = "hero" | "text" | "image" | "button" | "spacer" | "product" | "product-dd" | "raw-html";

export interface BaseBlock<TType extends MailingBlockType, TProps> {
  id: string;
  type: TType;
  props: TProps;
  layout: BlockLayout;
  meta?: {
    label?: string;
    hidden?: boolean;
    locked?: boolean;
  };
}

export interface HeroBlock extends BaseBlock<"hero", {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  href?: string;
}> {}

export interface TextBlock extends BaseBlock<"text", {
  html: string;
  align?: "left" | "center" | "right" | "justify";
  fontSize?: number;
  lineHeight?: number;
}> {}

export interface ImageBlock extends BaseBlock<"image", {
  src: string;
  alt: string;
  href?: string;
}> {}

export interface ButtonBlock extends BaseBlock<"button", {
  label: string;
  href: string;
  align?: "left" | "center" | "right";
}> {}

export interface SpacerBlock extends BaseBlock<"spacer", {
  height: number;
}> {}

export interface ProductBlock extends BaseBlock<"product", {
  imageUrl: string;
  name: string;
  brand?: string;
  price: string;
  unit?: string;
  href: string;
  ctaLabel?: string;
}> {}

export interface ProductDdBlock extends BaseBlock<"product-dd", {
  // ── Imagen del producto ───────────────────────────────────────────
  imageUrl: string;
  // ── Badge principal (draggable dentro de la imagen) ──────────────
  discountLabel: string;
  discountBadgeBg: string;
  discountBadgeFg: string;
  badgeTop: number;          // posición vertical en % dentro de la imagen (0-100)
  badgeLeft: number;         // posición horizontal en % (0-100)
  // ── Badge secundaria (esquina superior derecha imagen) ───────────
  secondBadge?: string;
  secondBadgeBg?: string;
  secondBadgeFg?: string;
  // ── Precios ───────────────────────────────────────────────────────
  originalPrice: string;     // precio tachado
  price: string;             // precio con descuento
  priceColor: string;        // color del precio descontado
  // ── Info del producto ─────────────────────────────────────────────
  name: string;
  brand?: string;
  unit?: string;
  // ── Logo de marca (esquina derecha panel) ────────────────────────
  logoUrl?: string;
  logoSize?: number;         // ancho en px (default 60)
  logoAlign?: "left" | "center" | "right";
  // ── CTA ──────────────────────────────────────────────────────────
  ctaLabel?: string;
  href: string;
}> {}

export interface RawHtmlBlock extends BaseBlock<"raw-html", {
  html: string;
  presetId?: string;
  presetLabel?: string;
}> {}

export type MailingBlock = HeroBlock | TextBlock | ImageBlock | ButtonBlock | SpacerBlock | ProductBlock | ProductDdBlock | RawHtmlBlock;