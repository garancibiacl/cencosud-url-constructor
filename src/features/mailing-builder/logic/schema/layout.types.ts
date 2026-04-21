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
  backgroundImage?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderAll?: boolean;
  visibility?: "all" | "desktop" | "mobile";
  blockAlign?: "left" | "center" | "right";
  width?: number;
  widthUnit?: "px" | "%";
}