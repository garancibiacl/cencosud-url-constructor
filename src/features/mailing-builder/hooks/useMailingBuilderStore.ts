import { create } from "zustand";
import type { MailingBlock, MailingBlockType } from "../logic/schema/block.types";
import type { MailingDocument } from "../logic/schema/mailing.types";
import { createBlock } from "../logic/builders/createBlock";
import { createDefaultMailing } from "../logic/builders/createDefaultMailing";

interface MailingBuilderState {
  document: MailingDocument;
  selectedBlockId: string | null;
  devicePreview: "desktop" | "mobile";
  selectBlock: (id: string | null) => void;
  addBlock: (type: MailingBlockType) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateDocument: (updater: (current: MailingDocument) => MailingDocument) => void;
}

const cloneBlock = (block: MailingBlock): MailingBlock => ({
  ...block,
  id: crypto.randomUUID(),
  layout: block.layout ? { ...block.layout, padding: block.layout.padding ? { ...block.layout.padding } : undefined } : block.layout,
  props: structuredClone(block.props),
  meta: block.meta ? { ...block.meta } : undefined,
});

export const useMailingBuilderStore = create<MailingBuilderState>((set) => ({
  document: createDefaultMailing(),
  selectedBlockId: null,
  devicePreview: "desktop",
  selectBlock: (id) => set({ selectedBlockId: id }),
  addBlock: (type) => set((state) => {
    const nextBlock = createBlock(type);
    return {
      document: {
        ...state.document,
        blocks: [...state.document.blocks, nextBlock],
      },
      selectedBlockId: nextBlock.id,
    };
  }),
  removeBlock: (id) => set((state) => ({
    document: {
      ...state.document,
      blocks: state.document.blocks.filter((block) => block.id !== id),
    },
    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
  })),
  duplicateBlock: (id) => set((state) => {
    const index = state.document.blocks.findIndex((block) => block.id === id);
    if (index < 0) return state;

    const duplicated = cloneBlock(state.document.blocks[index]);
    const blocks = [...state.document.blocks];
    blocks.splice(index + 1, 0, duplicated);

    return {
      document: { ...state.document, blocks },
      selectedBlockId: duplicated.id,
    };
  }),
  moveBlock: (fromIndex, toIndex) => set((state) => {
    const blocks = [...state.document.blocks];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) {
      return state;
    }

    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);

    return {
      document: { ...state.document, blocks },
    };
  }),
  updateDocument: (updater) => set((state) => ({
    document: updater(state.document),
  })),
}));