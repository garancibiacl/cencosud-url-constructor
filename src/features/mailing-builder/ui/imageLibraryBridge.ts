// Breaks the circular dep: blockRegistry → Inspectors/Views → store → blockRegistry
// Inspectors and Views call open() here; MailingBuilderPage registers the real handler.
let _handler: ((blockId: string, field: string) => void) | null = null;

export const imageLibraryBridge = {
  register(fn: (blockId: string, field: string) => void) {
    _handler = fn;
  },
  open(blockId: string, field: string) {
    _handler?.(blockId, field);
  },
};
