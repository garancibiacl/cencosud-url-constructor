import { Mail, MoveDown, MoveUp, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { blockRegistry } from "../logic/registry/blockRegistry";
import { useMailingBuilderStore } from "../hooks/useMailingBuilderStore";

const CATEGORY_LABELS = {
  content: "Contenido",
  media: "Media",
  layout: "Layout",
} as const;

export default function MailingBuilderPage() {
  const { document, selectedBlockId, selectBlock, addBlock, removeBlock, duplicateBlock, moveBlock } = useMailingBuilderStore();
  const selectedBlock = document.blocks.find((block) => block.id === selectedBlockId) ?? null;
  const SelectedInspector = selectedBlock ? blockRegistry[selectedBlock.type].Inspector : null;

  const updateSelectedBlock = (nextBlock: typeof selectedBlock extends null ? never : NonNullable<typeof selectedBlock>) => {
    useMailingBuilderStore.setState((state) => ({
      document: {
        ...state.document,
        blocks: state.document.blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block)),
      },
    }));
  };

  const groupedBlocks = Object.values(blockRegistry).reduce<Record<string, typeof blockRegistry[keyof typeof blockRegistry][]>>((acc, definition) => {
    acc[definition.category] ??= [];
    acc[definition.category].push(definition);
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mailing Builder</h1>
            <p className="text-sm text-muted-foreground">Base técnica del editor visual desacoplado sobre JSON estructurado.</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_320px] gap-0">
        <aside className="border-r border-border bg-card">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-5">
              {Object.entries(groupedBlocks).map(([category, items]) => (
                <section key={category} className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {items.map((definition) => (
                      <Button
                        key={definition.type}
                        variant="outline"
                        className="justify-start"
                        onClick={() => addBlock(definition.type)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {definition.label}
                      </Button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <section className="min-h-0 bg-secondary/35 px-8 py-6">
          <div className="mx-auto flex h-full max-w-[760px] flex-col rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-6 py-4">
              <p className="text-sm font-semibold text-foreground">Canvas visual</p>
              <p className="text-xs text-muted-foreground">{document.name} · {document.blocks.length} bloques · {document.settings.width}px</p>
            </div>

            <ScrollArea className="h-full">
              <div className="p-6">
                <div
                  className="mx-auto min-h-full space-y-4 rounded-md border border-dashed border-border bg-background p-4"
                  style={{ width: `${document.settings.width}px`, maxWidth: "100%" }}
                >
                {document.blocks.map((block, index) => {
                  const isSelected = block.id === selectedBlockId;
                  const BlockView = blockRegistry[block.type].View;

                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => selectBlock(block.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected ? "border-primary bg-primary/5 shadow-[var(--shadow-card)]" : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{blockRegistry[block.type].label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{block.type} · span {block.layout.colSpan}/12</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); moveBlock(index, Math.max(0, index - 1)); }} disabled={index === 0}>
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); moveBlock(index, Math.min(document.blocks.length - 1, index + 1)); }} disabled={index === document.blocks.length - 1}>
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <BlockView block={block} isSelected={isSelected} />
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </ScrollArea>
          </div>
        </section>

        <aside className="border-l border-border bg-card">
          <div className="p-5">
            <Card>
              <CardHeader>
                <CardTitle>Inspector</CardTitle>
                <CardDescription>Propiedades contextuales del bloque seleccionado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selectedBlock ? (
                  <>
                    <div>
                      <p className="font-medium text-foreground">{blockRegistry[selectedBlock.type].label}</p>
                      <p className="text-muted-foreground">Tipo: {selectedBlock.type}</p>
                    </div>
                    <Separator />
                    {SelectedInspector ? <SelectedInspector block={selectedBlock} onChange={updateSelectedBlock} /> : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">Selecciona un bloque del canvas para inspeccionarlo.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}