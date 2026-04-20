import type { MailingBlock, MailingBlockType } from "../schema/block.types";

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export function createBlock(type: MailingBlockType): MailingBlock {
  switch (type) {
    case "hero":
      return {
        id: createId("hero"),
        type: "hero",
        layout: { colSpan: 12, padding: { bottom: 16 } },
        props: {
          title: "Nuevo Hero",
          subtitle: "Describe la campaña principal",
          imageUrl: "",
          ctaLabel: "Ver más",
          href: "",
        },
      };
    case "text":
      return {
        id: createId("text"),
        type: "text",
        layout: { colSpan: 12, padding: { top: 12, right: 24, bottom: 12, left: 24 } },
        props: {
          html: "<p>Escribe tu contenido aquí</p>",
          align: "left",
          fontSize: 16,
          lineHeight: 24,
        },
      };
    case "image":
      return {
        id: createId("image"),
        type: "image",
        layout: { colSpan: 12, padding: { bottom: 16 } },
        props: {
          src: "",
          alt: "",
          href: "",
        },
      };
    case "button":
      return {
        id: createId("button"),
        type: "button",
        layout: { colSpan: 12, padding: { top: 8, right: 24, bottom: 8, left: 24 } },
        props: {
          label: "Botón CTA",
          href: "",
          align: "center",
        },
      };
    case "spacer":
      return {
        id: createId("spacer"),
        type: "spacer",
        layout: { colSpan: 12 },
        props: {
          height: 24,
        },
      };
  }
}