/**
 * Thin re-export wrapper.
 *
 * La lógica de render vive en defaultRenderEngine (renderEngine.ts).
 * Este módulo mantiene la API pública que ya usa el resto del codebase
 * para no romper imports existentes.
 */

import type { MailingDocument } from "../schema/mailing.types";
import { buildTrackedUrl }       from "../render/renderUtils";
import { defaultRenderEngine }   from "../render/renderEngine";

/** Resuelve un link con UTM tracking a partir del documento. Usado por la UI. */
export const resolveTrackedLink = (
  value: string | undefined,
  document: MailingDocument,
): string => buildTrackedUrl(value, document);

/** Renderiza el documento completo como HTML email-safe. */
export const renderMailingHtml = (document: MailingDocument): string =>
  defaultRenderEngine.render(document);
