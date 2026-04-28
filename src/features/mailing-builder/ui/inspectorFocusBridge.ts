// Permite que las vistas del canvas le digan al inspector en qué sección
// debe enfocarse cuando el usuario hace click en un sub-elemento del bloque.
// Evita dependencias circulares: views NO importan el store.
//
// Soporta "pending": si el inspector aún no está montado cuando se hace click
// (primer click = selección), el evento se guarda y se reproduce al registrarse.
let _handler: ((blockId: string, section: string) => void) | null = null;
let _pending: { blockId: string; section: string } | null = null;

export const inspectorFocusBridge = {
  register(fn: (blockId: string, section: string) => void) {
    _handler = fn;
    if (_pending) {
      const p = _pending;
      _pending = null;
      requestAnimationFrame(() => fn(p.blockId, p.section));
    }
  },
  unregister() {
    _handler = null;
  },
  focus(blockId: string, section: string) {
    if (_handler) {
      _handler(blockId, section);
    } else {
      _pending = { blockId, section };
    }
  },
};
