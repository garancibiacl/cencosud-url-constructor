import type { ComponentType } from "react";
import type { MailingBlock, MailingBlockType } from "../schema/block.types";
import { createBlock } from "../builders/createBlock";
import { ButtonBlockView, HeroBlockView, ImageBlockView, SpacerBlockView, TextBlockView } from "../../ui/blocks/MailingBlockViews";

type BlockViewProps<TBlock extends MailingBlock = MailingBlock> = {
  block: TBlock;
  isSelected?: boolean;
};

type BlockInspectorProps<TBlock extends MailingBlock = MailingBlock> = {
  block: TBlock;
};

export interface BlockDefinition<TBlock extends MailingBlock = MailingBlock> {
  type: TBlock["type"];
  label: string;
  category: "content" | "media" | "layout";
  create: () => TBlock;
  View: ComponentType<BlockViewProps<TBlock>>;
  Inspector: ComponentType<BlockInspectorProps<TBlock>>;
}

const EmptyView = ({ block }: BlockViewProps) => `${block.type}` as unknown as null;
const EmptyInspector = ({ block }: BlockInspectorProps) => `${block.type}` as unknown as null;

export const blockRegistry: Record<MailingBlockType, BlockDefinition> = {
  hero: { type: "hero", label: "Hero", category: "content", create: () => createBlock("hero"), View: HeroBlockView, Inspector: EmptyInspector },
  text: { type: "text", label: "Texto", category: "content", create: () => createBlock("text"), View: TextBlockView, Inspector: EmptyInspector },
  image: { type: "image", label: "Imagen", category: "media", create: () => createBlock("image"), View: ImageBlockView, Inspector: EmptyInspector },
  button: { type: "button", label: "Botón", category: "content", create: () => createBlock("button"), View: ButtonBlockView, Inspector: EmptyInspector },
  spacer: { type: "spacer", label: "Espaciador", category: "layout", create: () => createBlock("spacer"), View: SpacerBlockView, Inspector: EmptyInspector },
};