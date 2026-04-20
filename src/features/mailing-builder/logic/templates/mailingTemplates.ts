import type { MailingDocument } from "../schema/mailing.types";

const createId = () => crypto.randomUUID();

export interface MailingTemplateDefinition {
  id: string;
  label: string;
  description: string;
  build: () => MailingDocument;
}

export const mailingTemplates: MailingTemplateDefinition[] = [
  {
    id: "promo-hero",
    label: "Promo Hero",
    description: "Hero principal, mensaje breve y CTA único.",
    build: () => ({
      id: createId(),
      name: "Template Promo Hero",
      version: "0.1.0",
      locale: "es-CL",
      settings: {
        width: 600,
        backgroundColor: "hsl(var(--background))",
        contentBackgroundColor: "hsl(var(--card))",
        fontFamily: "Arial, Helvetica, sans-serif",
        preheader: "Promoción destacada de la semana",
        subject: "Promo principal",
        linkTracking: {
          enabled: true,
          utmSource: "email",
          utmMedium: "mailing",
          utmCampaign: "promo-hero",
          promoName: "promo-hero",
        },
      },
      variables: { utm_source: "email", utm_medium: "mailing" },
      blocks: [
        {
          id: `hero-${createId().slice(0, 8)}`,
          type: "hero",
          layout: { colSpan: 12, padding: { bottom: 16 } },
          props: {
            title: "Oferta destacada",
            subtitle: "Un mensaje corto, directo y listo para conversión.",
            imageUrl: "",
            ctaLabel: "Comprar ahora",
            href: "https://example.com",
          },
        },
        {
          id: `text-${createId().slice(0, 8)}`,
          type: "text",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 8, left: 24 } },
          props: {
            html: "<p>Refuerza aquí el beneficio principal, vigencia y condiciones clave.</p>",
            align: "left",
            fontSize: 16,
            lineHeight: 24,
          },
        },
        {
          id: `button-${createId().slice(0, 8)}`,
          type: "button",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 24, left: 24 } },
          props: { label: "Ir a la promo", href: "https://example.com", align: "center" },
        },
      ],
    }),
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Mensaje con imagen secundaria y cierre editorial.",
    build: () => ({
      id: createId(),
      name: "Template Editorial",
      version: "0.1.0",
      locale: "es-CL",
      settings: {
        width: 600,
        backgroundColor: "hsl(var(--background))",
        contentBackgroundColor: "hsl(var(--card))",
        fontFamily: "Georgia, Times New Roman, serif",
        preheader: "Selección editorial",
        subject: "Inspiración de temporada",
        linkTracking: {
          enabled: true,
          utmSource: "email",
          utmMedium: "mailing",
          utmCampaign: "editorial",
          promoName: "editorial",
        },
      },
      variables: { utm_source: "email", utm_medium: "mailing" },
      blocks: [
        {
          id: `text-${createId().slice(0, 8)}`,
          type: "text",
          layout: { colSpan: 12, padding: { top: 28, right: 32, bottom: 20, left: 32 } },
          props: {
            html: "<h2>Una historia visual para tu campaña</h2><p>Abre con una introducción más narrativa y una propuesta de valor menos comercial.</p>",
            align: "left",
            fontSize: 17,
            lineHeight: 26,
          },
        },
        {
          id: `image-${createId().slice(0, 8)}`,
          type: "image",
          layout: { colSpan: 12, padding: { right: 24, bottom: 16, left: 24 } },
          props: { src: "", alt: "Imagen editorial", href: "https://example.com" },
        },
        {
          id: `button-${createId().slice(0, 8)}`,
          type: "button",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 24, left: 24 } },
          props: { label: "Descubrir", href: "https://example.com", align: "left" },
        },
      ],
    }),
  },
  {
    id: "catalogo-corto",
    label: "Catálogo corto",
    description: "Combinación rápida para promo, imagen y remate.",
    build: () => ({
      id: createId(),
      name: "Template Catálogo Corto",
      version: "0.1.0",
      locale: "es-CL",
      settings: {
        width: 600,
        backgroundColor: "hsl(var(--background))",
        contentBackgroundColor: "hsl(var(--card))",
        fontFamily: "Arial, Helvetica, sans-serif",
        preheader: "Selección rápida de productos",
        subject: "Catálogo corto",
        linkTracking: {
          enabled: true,
          utmSource: "email",
          utmMedium: "mailing",
          utmCampaign: "catalogo-corto",
          promoName: "catalogo-corto",
        },
      },
      variables: { utm_source: "email", utm_medium: "mailing" },
      blocks: [
        {
          id: `hero-${createId().slice(0, 8)}`,
          type: "hero",
          layout: { colSpan: 12, padding: { bottom: 12 } },
          props: {
            title: "Top productos de hoy",
            subtitle: "Destaca una selección reducida para escaneo rápido.",
            imageUrl: "",
            ctaLabel: "Ver catálogo",
            href: "https://example.com",
          },
        },
        {
          id: `image-${createId().slice(0, 8)}`,
          type: "image",
          layout: { colSpan: 12, padding: { right: 24, bottom: 12, left: 24 } },
          props: { src: "", alt: "Producto destacado", href: "https://example.com" },
        },
        {
          id: `text-${createId().slice(0, 8)}`,
          type: "text",
          layout: { colSpan: 12, padding: { top: 4, right: 24, bottom: 20, left: 24 } },
          props: {
            html: "<p>Usa este bloque para precio, beneficio o urgencia comercial.</p>",
            align: "center",
            fontSize: 16,
            lineHeight: 24,
          },
        },
      ],
    }),
  },
];