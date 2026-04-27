/**
 * Zod validation schema for MailingDocument.
 *
 * Used at the API boundary (Vercel Edge Function) to validate
 * untrusted JSON before passing it to defaultRenderEngine.render().
 *
 * Mirror of the TypeScript types in:
 *   block.types.ts / layout.types.ts / row.types.ts / mailing.types.ts
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const paddingSchema = z.object({
  top:    z.number().optional(),
  right:  z.number().optional(),
  bottom: z.number().optional(),
  left:   z.number().optional(),
}).optional();

const blockLayoutSchema = z.object({
  colSpan:         z.number().int().min(1).max(12),
  colStart:        z.number().int().optional(),
  padding:         paddingSchema,
  backgroundColor: z.string().optional(),
});

const blockMetaSchema = z.object({
  label:  z.string().optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
}).optional();

// ---------------------------------------------------------------------------
// Block schemas (discriminated union on "type")
// ---------------------------------------------------------------------------

const heroBlockSchema = z.object({
  id:     z.string(),
  type:   z.literal("hero"),
  layout: blockLayoutSchema,
  meta:   blockMetaSchema,
  props: z.object({
    title:    z.string(),
    subtitle: z.string().optional(),
    imageUrl: z.string(),
    ctaLabel: z.string().optional(),
    href:     z.string().optional(),
  }),
});

const textBlockSchema = z.object({
  id:     z.string(),
  type:   z.literal("text"),
  layout: blockLayoutSchema,
  meta:   blockMetaSchema,
  props: z.object({
    html:       z.string(),
    align:      z.enum(["left", "center", "right"]).optional(),
    fontSize:   z.number().positive().optional(),
    lineHeight: z.number().positive().optional(),
  }),
});

const imageBlockSchema = z.object({
  id:     z.string(),
  type:   z.literal("image"),
  layout: blockLayoutSchema,
  meta:   blockMetaSchema,
  props: z.object({
    src:  z.string(),
    alt:  z.string(),
    href: z.string().optional(),
  }),
});

const buttonBlockSchema = z.object({
  id:     z.string(),
  type:   z.literal("button"),
  layout: blockLayoutSchema,
  meta:   blockMetaSchema,
  props: z.object({
    label: z.string(),
    href:  z.string(),
    align: z.enum(["left", "center", "right"]).optional(),
  }),
});

const spacerBlockSchema = z.object({
  id:     z.string(),
  type:   z.literal("spacer"),
  layout: blockLayoutSchema,
  meta:   blockMetaSchema,
  props: z.object({
    height: z.number().int().positive(),
  }),
});

export const mailingBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  spacerBlockSchema,
]);

// ---------------------------------------------------------------------------
// Column and Row
// ---------------------------------------------------------------------------

const columnMetaSchema = z.object({
  backgroundColor: z.string().optional(),
  padding:         paddingSchema,
}).optional();

const rowMetaSchema = z.object({
  label:           z.string().optional(),
  backgroundColor: z.string().optional(),
  padding:         paddingSchema,
}).optional();

export const mailingColumnSchema = z.object({
  id:      z.string(),
  colSpan: z.number().int().min(1).max(12),
  blocks:  z.array(mailingBlockSchema),
  meta:    columnMetaSchema,
});

export const mailingRowSchema = z.object({
  id:      z.string(),
  columns: z.array(mailingColumnSchema).min(1),
  meta:    rowMetaSchema,
});

// ---------------------------------------------------------------------------
// Settings and Document
// ---------------------------------------------------------------------------

export const mailingSettingsSchema = z.object({
  width:                  z.number().int().positive(),
  backgroundColor:        z.string(),
  contentBackgroundColor: z.string(),
  fontFamily:             z.string(),
  preheader:              z.string().optional(),
  subject:                z.string().optional(),
  senderEmail:            z.string().optional(),
  senderName:             z.string().optional(),
  linkTracking: z.object({
    enabled:     z.boolean(),
    utmSource:   z.string(),
    utmMedium:   z.string(),
    utmCampaign: z.string(),
    promoName:   z.string().optional(),
  }),
});

export const mailingDocumentSchema = z.object({
  id:        z.string(),
  name:      z.string(),
  version:   z.string(),
  locale:    z.literal("es-CL"),
  settings:  mailingSettingsSchema,
  variables: z.record(z.string()),
  rows:      z.array(mailingRowSchema),
});

export type MailingDocumentInput = z.input<typeof mailingDocumentSchema>;
