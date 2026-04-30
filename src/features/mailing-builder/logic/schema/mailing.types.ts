import type { MailingRow } from "./row.types";

export interface GlobalStylesTypography {
  fontFamily?: string;
  bodyFontSize?: number;
  bodyColor?: string;
  headingFontFamily?: string;
  headingFontSize?: number;
  headingColor?: string;
  linkColor?: string;
}

export interface GlobalStylesButton {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface GlobalStyles {
  typography?: GlobalStylesTypography;
  button?: GlobalStylesButton;
}

export interface MailingSettings {
  width: number;
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  preheader?: string;
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  brand?: import("../brands/brand.types").BrandId;
  linkTracking: {
    enabled: boolean;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    promoName?: string;
  };
  globalStyles?: GlobalStyles;
}

export interface MailingDocument {
  id: string;
  name: string;
  /** Semver del schema. Aumentar al hacer breaking changes. */
  version: string;
  locale: "es-CL";
  settings: MailingSettings;
  variables: Record<string, string>;
  /** Sistema de layout Row → Column → Block. */
  rows: MailingRow[];
}
