import type { MailingBlock, MailingBlockType } from "../schema/block.types";
import { blockRegistry } from "../registry/blockRegistry";

/**
 * Crea un bloque nuevo del tipo indicado con sus props y layout por defecto.
 *
 * Los defaults viven en blockRegistry — esta función no tiene switch.
 * Agregar un nuevo tipo de bloque NO requiere modificar este archivo.
 */
export function createBlock(type: MailingBlockType): MailingBlock {
  return blockRegistry[type].create();
}
