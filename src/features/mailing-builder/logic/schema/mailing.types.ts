import type { MailingBlock } from "./block.types";

export interface MailingSettings {
  width: number;
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  preheader?: string;
  subject?: string;
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
  version: string;
  locale: "es-CL";
  settings: MailingSettings;
  variables: Record<string, string>;
  blocks: MailingBlock[];
}