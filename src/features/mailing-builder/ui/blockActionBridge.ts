// Permite que las vistas de bloque (canvas) disparen acciones de bloque
// sin importar el store directamente — misma estrategia que inspectorFocusBridge.
type BlockAction = "duplicate" | "remove";
type Handler = (action: BlockAction) => void;

const handlers = new Map<string, Handler>();

export const blockActionBridge = {
  register(blockId: string, handler: Handler): () => void {
    handlers.set(blockId, handler);
    return () => { handlers.delete(blockId); };
  },
  emit(blockId: string, action: BlockAction): void {
    handlers.get(blockId)?.(action);
  },
};
