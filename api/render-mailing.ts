/**
 * Vercel Edge Function — POST /api/render-mailing
 *
 * Recibe un MailingDocument como JSON y devuelve HTML email-safe.
 * Usa el mismo defaultRenderEngine que el preview del cliente,
 * garantizando consistencia total entre browser y servidor.
 *
 * REQUEST
 *   Content-Type: application/json
 *   Body: MailingDocument (ver mailing.schema.ts)
 *
 * RESPONSE 200
 *   Content-Type: text/html; charset=utf-8
 *   Body: HTML email completo
 *
 * RESPONSE 400
 *   Content-Type: application/json
 *   Body: { error: string; details?: ZodIssue[] }
 *
 * RESPONSE 405
 *   Body: Method Not Allowed
 */

export const config = { runtime: "edge" };

import { mailingDocumentSchema } from "../src/features/mailing-builder/logic/schema/mailing.schema";
import { migrateLegacyDocument }  from "../src/features/mailing-builder/logic/builders/migrateLegacyDocument";
import { defaultRenderEngine }    from "../src/features/mailing-builder/logic/render/renderEngine";

export default async function handler(request: Request): Promise<Response> {
  // ── Only POST allowed ────────────────────────────────────────────────────
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate with Zod ────────────────────────────────────────────────────
  const parsed = mailingDocumentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid document schema", details: parsed.error.issues },
      { status: 400 },
    );
  }

  // ── Migrate legacy format if needed (blocks[] → rows[]) ──────────────────
  const doc = migrateLegacyDocument(parsed.data as Parameters<typeof migrateLegacyDocument>[0]);

  // ── Render ───────────────────────────────────────────────────────────────
  const html = defaultRenderEngine.render(doc);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Prevent caching of personalised mailings
      "Cache-Control": "no-store",
    },
  });
}
