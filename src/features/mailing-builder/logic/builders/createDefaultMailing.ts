import type { MailingDocument } from "../schema/mailing.types";
import { createBlock } from "./createBlock";

export function createDefaultMailing(): MailingDocument {
  return {
    id: crypto.randomUUID(),
    name: "Nuevo Mailing",
    version: "0.1.0",
    locale: "es-CL",
    settings: {
      width: 600,
      backgroundColor: "hsl(var(--background))",
      contentBackgroundColor: "hsl(var(--card))",
      fontFamily: "Arial, Helvetica, sans-serif",
      preheader: "Resumen de la campaña",
      subject: "Nuevo mailing",
      linkTracking: {
        enabled: true,
        utmSource: "email",
        utmMedium: "mailing",
        utmCampaign: "campana-general",
        promoName: "nuevo-mailing",
      },
    },
    variables: {
      utm_source: "email",
      utm_medium: "mailing",
    },
    blocks: [createBlock("hero"), createBlock("text"), createBlock("button")],
  };
}