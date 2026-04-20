import type { MailingBlock } from "./block.types";

export interface MailingSettings {
  width: 600;
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  preheader?: string;
  subject?: string;
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