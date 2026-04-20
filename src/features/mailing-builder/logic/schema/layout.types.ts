export interface BlockPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface BlockLayout {
  colSpan: number;
  colStart?: number;
  padding?: BlockPadding;
  backgroundColor?: string;
}