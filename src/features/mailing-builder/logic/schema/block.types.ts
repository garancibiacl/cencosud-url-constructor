import type { BlockLayout } from "./layout.types";

export type MailingBlockType = "hero" | "text" | "image" | "button" | "spacer" | "product";

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

export type MailingBlock = HeroBlock | TextBlock | ImageBlock | ButtonBlock | SpacerBlock | ProductBlock;