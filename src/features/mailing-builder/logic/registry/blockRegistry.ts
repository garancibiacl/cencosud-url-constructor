import type { ComponentType } from "react";
import type { MailingBlock, MailingBlockType } from "../schema/block.types";
import { createBlock } from "../builders/createBlock";

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

const EmptyView = ({ block }: BlockViewProps) => <div>{block.type}</div>;
const EmptyInspector = ({ block }: BlockInspectorProps) => <div>{block.type}</div>;

export const blockRegistry: Record<MailingBlockType, BlockDefinition> = {
  hero: { type: "hero", label: "Hero", category: "content", create: () => createBlock("hero"), View: EmptyView, Inspector: EmptyInspector },
  text: { type: "text", label: "Texto", category: "content", create: () => createBlock("text"), View: EmptyView, Inspector: EmptyInspector },
  image: { type: "image", label: "Imagen", category: "media", create: () => createBlock("image"), View: EmptyView, Inspector: EmptyInspector },
  button: { type: "button", label: "Botón", category: "content", create: () => createBlock("button"), View: EmptyView, Inspector: EmptyInspector },
  spacer: { type: "spacer", label: "Espaciador", category: "layout", create: () => createBlock("spacer"), View: EmptyView, Inspector: EmptyInspector },
};