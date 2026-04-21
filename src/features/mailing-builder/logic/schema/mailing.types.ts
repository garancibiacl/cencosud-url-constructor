import type { MailingRow } from "./row.types";

export interface MailingSettings {
  width: number;
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  preheader?: string;
  subject?: string;
  brand?: import("../brands/brand.types").BrandId;
  linkTracking: {
    enabled: boolean;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    promoName?: string;
  };
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
