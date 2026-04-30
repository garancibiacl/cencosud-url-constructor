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
  badgeFontSize?: number;      // tamaño de fuente del badge (px)
  badgeBorderRadius?: number;  // radio global (vinculado)
  badgeRadiusTL?: number;      // esquina superior-izquierda
  badgeRadiusTR?: number;      // esquina superior-derecha
  badgeRadiusBR?: number;      // esquina inferior-derecha
  badgeRadiusBL?: number;      // esquina inferior-izquierda
  badgeBorderWidth?: number;   // grosor del borde (px)
  badgeBorderColor?: string;   // color del borde
  // ── Badge secundaria (esquina superior derecha imagen) ───────────
  secondBadge?: string;
  secondBadgeBg?: string;
  secondBadgeFg?: string;
  // ── Precios ───────────────────────────────────────────────────────
  originalPrice?: string;    // precio tachado (obsoleto, mantenido por compatibilidad)
  price: string;             // precio con descuento
  priceColor: string;        // color del precio descontado
  // ── Info del producto ─────────────────────────────────────────────
  name: string;
  brand?: string;
  unit?: string;
  // ── Logo de marca (esquina derecha panel) ────────────────────────
  logoUrl?: string;
  logoShow?: boolean;        // false = ocultar logo (default true)
  logoSize?: number;         // ancho en px (default 60)
  logoAlign?: "left" | "center" | "right";
  // ── CTA ──────────────────────────────────────────────────────────
  ctaLabel?: string;
  href: string;
  // ── Columna derecha ───────────────────────────────────────────────
  rightBgColor?: string;  // fondo columna derecha (default verde #3DBE4A)
  leftColWidth?: number;  // % ancho columna izquierda (default 48, rango 20-80)
  priceSize?: number;     // font-size del precio en px (default 50)
  priceFg?: string;       // color del precio (default #ffffff)
  priceAlign?: "left" | "center" | "right";
  nameAlign?:  "left" | "center" | "right";
  ahorroLabel?: string;   // ej: "$ 1.640" — si vacío no se muestra
  desdeLabel?: string;    // ej: "Desde $6.459 x kg" — si vacío no se muestra
  // ── Etiqueta dual de precio (split badge) ────────────────────────
  priceTagShow?:    boolean;
  priceTagLabel?:   string;
  priceTagLabelBg?: string;
  priceTagLabelFg?: string;
  priceTagValue?:   string;
  priceTagValueBg?: string;
  priceTagValueFg?: string;
  priceTagRadius?:  number;
  priceTagAlign?:   "left" | "center" | "right";
  // ── Descuento porcentual ──────────────────────────────────────
  discountNumber?: string;      // "30"
  discountNumberColor?: string; // "#ffffff"
  discountSymbol?: string;      // "%"
  discountSymbolColor?: string; // "#ffffff"
  discountText?: string;        // "DCTO."
  discountTextColor?: string;   // "#ffffff"
  discountAlign?: "left" | "center" | "right";
  discountPadding?: { top: number; right: number; bottom: number; left: number };
  discountMarginV?: number;     // margen vertical (top/bottom) en px
  discountMarginH?: number;     // margen horizontal (left/right) en px
  // ── Espaciado precio ─────────────────────────────────────────────────
  pricePadding?: { top: number; right: number; bottom: number; left: number };
  priceMarginV?: number;
  priceMarginH?: number;
  // ── Espaciado nombre/descripción ─────────────────────────────────────
  namePadding?: { top: number; right: number; bottom: number; left: number };
  nameMarginV?: number;
  nameMarginH?: number;
  // ── Badge Oferta ─────────────────────────────────────────────
  ofertaShow?: boolean;
  ofertaLabel?: string;         // "Oferta"
  ofertaLabelFg?: string;       // "#1a5c2a"
  ofertaLogoUrl?: string;
  ofertaLogoSize?: number;      // px, default 80
  ofertaBg?: string;            // "#ffffff"
  ofertaBorderRadius?: number;  // default 6
  // ── Orden de secciones en la columna derecha ──────────────────────
  sectionOrder?: string[];      // e.g. ["discount","price","priceTag","name"]
}> {}

export interface RawHtmlBlock extends BaseBlock<"raw-html", {
  html: string;
  presetId?: string;
  presetLabel?: string;
}> {}

export type MailingBlock = HeroBlock | TextBlock | ImageBlock | ButtonBlock | SpacerBlock | ProductBlock | ProductDdBlock | RawHtmlBlock;