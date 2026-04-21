import type { MailingDocument } from "../schema/mailing.types";
import { fullWidthRow, createRow, createColumn } from "../builders/createRow";

const uid = () => crypto.randomUUID().slice(0, 8);

export interface MailingTemplateDefinition {
  id: string;
  label: string;
  description: string;
  build: () => MailingDocument;
}

export const mailingTemplates: MailingTemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Template: Promo Hero
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "promo-hero",
    label: "Promo Hero",
    description: "Hero principal, mensaje breve y CTA único.",
    build: () => ({
      id: crypto.randomUUID(),
      name: "Template Promo Hero",
      version: "1.0.0",
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
      rows: [
        fullWidthRow({
          id: `hero-${uid()}`, type: "hero",
          layout: { colSpan: 12, padding: { bottom: 16 } },
          props: { title: "Oferta destacada", subtitle: "Un mensaje corto, directo y listo para conversión.", imageUrl: "", ctaLabel: "Comprar ahora", href: "https://example.com" },
        }),
        fullWidthRow({
          id: `text-${uid()}`, type: "text",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 8, left: 24 } },
          props: { html: "<p>Refuerza aquí el beneficio principal, vigencia y condiciones clave.</p>", align: "left", fontSize: 16, lineHeight: 24 },
        }),
        fullWidthRow({
          id: `button-${uid()}`, type: "button",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 24, left: 24 } },
          props: { label: "Ir a la promo", href: "https://example.com", align: "center" },
        }),
      ],
    }),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Template: Editorial
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "editorial",
    label: "Editorial",
    description: "Mensaje con imagen secundaria y cierre editorial.",
    build: () => ({
      id: crypto.randomUUID(),
      name: "Template Editorial",
      version: "1.0.0",
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
      rows: [
        fullWidthRow({
          id: `text-${uid()}`, type: "text",
          layout: { colSpan: 12, padding: { top: 28, right: 32, bottom: 20, left: 32 } },
          props: { html: "<h2>Una historia visual para tu campaña</h2><p>Abre con una introducción más narrativa y una propuesta de valor menos comercial.</p>", align: "left", fontSize: 17, lineHeight: 26 },
        }),
        fullWidthRow({
          id: `image-${uid()}`, type: "image",
          layout: { colSpan: 12, padding: { right: 24, bottom: 16, left: 24 } },
          props: { src: "", alt: "Imagen editorial", href: "https://example.com" },
        }),
        fullWidthRow({
          id: `button-${uid()}`, type: "button",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 24, left: 24 } },
          props: { label: "Descubrir", href: "https://example.com", align: "left" },
        }),
      ],
    }),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Template: Catálogo Corto
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "catalogo-corto",
    label: "Catálogo corto",
    description: "Combinación rápida para promo, imagen y remate.",
    build: () => ({
      id: crypto.randomUUID(),
      name: "Template Catálogo Corto",
      version: "1.0.0",
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
      rows: [
        fullWidthRow({
          id: `hero-${uid()}`, type: "hero",
          layout: { colSpan: 12, padding: { bottom: 12 } },
          props: { title: "Top productos de hoy", subtitle: "Destaca una selección reducida para escaneo rápido.", imageUrl: "", ctaLabel: "Ver catálogo", href: "https://example.com" },
        }),
        fullWidthRow({
          id: `image-${uid()}`, type: "image",
          layout: { colSpan: 12, padding: { right: 24, bottom: 12, left: 24 } },
          props: { src: "", alt: "Producto destacado", href: "https://example.com" },
        }),
        fullWidthRow({
          id: `text-${uid()}`, type: "text",
          layout: { colSpan: 12, padding: { top: 4, right: 24, bottom: 20, left: 24 } },
          props: { html: "<p>Usa este bloque para precio, beneficio o urgencia comercial.</p>", align: "center", fontSize: 16, lineHeight: 24 },
        }),
      ],
    }),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Template: Catálogo 2 columnas — demuestra el layout system
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "catalogo-2col",
    label: "Catálogo 2 columnas",
    description: "Layout half/half para mostrar dos productos lado a lado.",
    build: () => ({
      id: crypto.randomUUID(),
      name: "Template Catálogo 2 Col",
      version: "1.0.0",
      locale: "es-CL",
      settings: {
        width: 600,
        backgroundColor: "hsl(var(--background))",
        contentBackgroundColor: "hsl(var(--card))",
        fontFamily: "Arial, Helvetica, sans-serif",
        preheader: "Dos productos imperdibles",
        subject: "Catálogo 2 columnas",
        linkTracking: {
          enabled: true,
          utmSource: "email",
          utmMedium: "mailing",
          utmCampaign: "catalogo-2col",
          promoName: "catalogo-2col",
        },
      },
      variables: { utm_source: "email", utm_medium: "mailing" },
      rows: [
        // Hero full-width
        fullWidthRow({
          id: `hero-${uid()}`, type: "hero",
          layout: { colSpan: 12, padding: { bottom: 12 } },
          props: { title: "Selección de la semana", subtitle: "", imageUrl: "", ctaLabel: "", href: "" },
        }),
        // Row half/half — 2 imágenes en columnas
        {
          id: `row-${uid()}`,
          columns: [
            createColumn(6, [{
              id: `image-${uid()}`, type: "image",
              layout: { colSpan: 12, padding: { top: 8, right: 8, bottom: 8, left: 8 } },
              props: { src: "", alt: "Producto 1", href: "https://example.com" },
            }]),
            createColumn(6, [{
              id: `image-${uid()}`, type: "image",
              layout: { colSpan: 12, padding: { top: 8, right: 8, bottom: 8, left: 8 } },
              props: { src: "", alt: "Producto 2", href: "https://example.com" },
            }]),
          ],
        },
        // Row half/half — 2 textos con precios
        {
          id: `row-${uid()}`,
          columns: [
            createColumn(6, [{
              id: `text-${uid()}`, type: "text",
              layout: { colSpan: 12, padding: { top: 4, right: 12, bottom: 12, left: 12 } },
              props: { html: "<p><strong>Producto 1</strong><br/>Descripción corta y precio.</p>", align: "center", fontSize: 14, lineHeight: 20 },
            }]),
            createColumn(6, [{
              id: `text-${uid()}`, type: "text",
              layout: { colSpan: 12, padding: { top: 4, right: 12, bottom: 12, left: 12 } },
              props: { html: "<p><strong>Producto 2</strong><br/>Descripción corta y precio.</p>", align: "center", fontSize: 14, lineHeight: 20 },
            }]),
          ],
        },
        // CTA final
        fullWidthRow({
          id: `button-${uid()}`, type: "button",
          layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 24, left: 24 } },
          props: { label: "Ver todo el catálogo", href: "https://example.com", align: "center" },
        }),
      ],
    }),
  },
];
