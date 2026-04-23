import type { MailingBlockType } from "./block.types";

export interface PlaceholderSlot {
  type: MailingBlockType;
  label: string;
}

export interface LayoutColumnSchema {
  /** Stable semantic ID within this layout (e.g. "main", "left", "right", "col-1") */
  id: string;
  /** Width in 12-part grid units */
  colSpan: number;
  /** undefined = all block types allowed */
  allowedBlocks?: MailingBlockType[];
  /** Shown as interactive hints when column is empty */
  placeholders?: PlaceholderSlot[];
  responsive?: {
    mobile?: {
      colSpan?: number;
      order?: number;
      hidden?: boolean;
    };
  };
}

export interface LayoutSchema {
  id: string;
  label: string;
  description?: string;
  columns: LayoutColumnSchema[];
  tags?: string[];
}
