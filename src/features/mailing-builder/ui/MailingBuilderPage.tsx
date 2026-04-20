import { useEffect, useMemo, useState } from "react";
import { Mail, MoveDown, MoveUp, Plus, Trash2, Copy, Download, Save, History, Eye, PenSquare, CodeXml, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { blockRegistry } from "../logic/registry/blockRegistry";
import { analyzeMailingHtml } from "../logic/exporters/analyzeMailingHtml";
import { renderMailingHtml } from "../logic/exporters/renderMailingHtml";
import { createDefaultMailing } from "../logic/builders/createDefaultMailing";
import { useMailings } from "../hooks/useMailings";
import { useMailingBuilderStore } from "../hooks/useMailingBuilderStore";

const CATEGORY_LABELS = {
  content: "Contenido",
  media: "Media",
  layout: "Layout",
} as const;

export default function MailingBuilderPage() {
  const { user } = useAuth();
  const {
    document,
    selectedBlockId,
    activeMailingId,
    selectBlock,
    addBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    replaceDocument,
    setActiveMailingId,
  } = useMailingBuilderStore();
  const { toast } = useToast();
  const { mailings, versions, loading, saving, refreshMailings, loadVersions, saveDraft, saveVersion, scheduleAutosave, cancelAutosave } = useMailings();
  const [versionNote, setVersionNote] = useState("");
  const [previewMode, setPreviewMode] = useState<"canvas" | "split" | "html">("canvas");
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const selectedBlock = document.blocks.find((block) => block.id === selectedBlockId) ?? null;
  const SelectedInspector = selectedBlock ? blockRegistry[selectedBlock.type].Inspector : null;
  const htmlPreview = useMemo(() => renderMailingHtml(document), [document]);
  const compatibility = useMemo(() => analyzeMailingHtml(htmlPreview), [htmlPreview]);

  useEffect(() => {
    void refreshMailings();
  }, [refreshMailings]);

  useEffect(() => {
    void loadVersions(activeMailingId);
  }, [activeMailingId, loadVersions]);

  useEffect(() => {
    if (!user) return;
    scheduleAutosave({ mailingId: activeMailingId, userId: user.id, document, delay: 1500 });
    setLastAutosaveAt(new Date().toISOString());
    return () => cancelAutosave();
  }, [activeMailingId, cancelAutosave, document, scheduleAutosave, user]);

  const exportHtml = () => htmlPreview;

  const handleCopyHtml = async () => {
    const html = exportHtml();
    await navigator.clipboard.writeText(html);
    toast({ title: "HTML copiado", description: "El mailing quedó listo para pegar o enviar a desarrollo." });
  };

  const handleDownloadHtml = () => {
    const html = exportHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.name.trim().toLowerCase().replace(/\s+/g, "-") || "mailing"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "HTML descargado", description: "Se descargó una versión email-safe del mailing." });
  };

  const handleNewDraft = () => {
    replaceDocument(createDefaultMailing(), null);
    setVersionNote("");
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    const result = await saveDraft({ mailingId: activeMailingId, userId: user.id, document });
    if (!result.savedId) {
      toast({ title: "No se pudo guardar", description: "Revisa tu sesión e inténtalo nuevamente.", variant: "destructive" });
      return;
    }
    setActiveMailingId(result.savedId);
    setLastAutosaveAt(new Date().toISOString());
    toast({ title: "Borrador guardado", description: "El mailing quedó almacenado en backend." });
  };

  const handleSaveVersion = async () => {
    if (!user) return;
    const mailingId = activeMailingId ?? await saveDraft({ userId: user.id, document }).then((result) => result.savedId);
    if (!mailingId) {
      toast({ title: "No se pudo versionar", description: "Primero necesitamos guardar el mailing.", variant: "destructive" });
      return;
    }
    setActiveMailingId(mailingId);
    const result = await saveVersion({ mailingId, userId: user.id, document, note: versionNote });
    if (!result.versionNumber) {
      toast({ title: "No se pudo crear la versión", description: "Inténtalo nuevamente en unos segundos.", variant: "destructive" });
      return;
    }
    setVersionNote("");
    toast({ title: `Versión v${result.versionNumber} creada`, description: "El snapshot quedó guardado en el historial." });
  };

  const handleLoadMailing = async (mailingId: string) => {
    const selectedMailing = mailings.find((item) => item.id === mailingId);
    if (!selectedMailing) return;
    replaceDocument(selectedMailing.document, selectedMailing.id);
    await loadVersions(selectedMailing.id);
    toast({ title: "Mailing cargado", description: "Se cargó el borrador seleccionado." });
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versions.find((item) => item.id === versionId);
    if (!version || !activeMailingId) return;
    replaceDocument(version.snapshot, activeMailingId);
    toast({ title: `Versión v${version.versionNumber} restaurada`, description: "El canvas volvió al snapshot seleccionado." });
  };

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mailing Builder</h1>
              <p className="text-sm text-muted-foreground">Base técnica del editor visual desacoplado sobre JSON estructurado.</p>
              <p className="mt-1 text-xs text-muted-foreground">Autosave {lastAutosaveAt ? `activo · ${new Date(lastAutosaveAt).toLocaleTimeString("es-CL")}` : "pendiente"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewDraft}>
              Nuevo
            </Button>
            <Button variant="outline" onClick={() => void handleSaveDraft()} disabled={!user || saving}>
              <Save className="mr-2 h-4 w-4" />
              Guardar draft
            </Button>
            <Button variant="outline" onClick={() => void handleSaveVersion()} disabled={!user || saving}>
              <History className="mr-2 h-4 w-4" />
              Guardar versión
            </Button>
            <Button variant="outline" onClick={() => void handleCopyHtml()}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar HTML
            </Button>
            <Button onClick={handleDownloadHtml}>
              <Download className="mr-2 h-4 w-4" />
              Descargar HTML
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_320px] gap-0">
        <aside className="border-r border-border bg-card">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-5">
              <section className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Guardado</p>
                </div>
                <Input
                  value={versionNote}
                  onChange={(event) => setVersionNote(event.target.value)}
                  placeholder="Nota para la versión"
                />
                <div className="grid gap-2">
                  {loading ? <p className="text-xs text-muted-foreground">Cargando borradores…</p> : null}
                  {mailings.slice(0, 6).map((mailing) => (
                    <button
                      key={mailing.id}
                      type="button"
                      onClick={() => void handleLoadMailing(mailing.id)}
                      className={`rounded-md border px-3 py-2 text-left transition ${activeMailingId === mailing.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <p className="text-sm font-medium text-foreground">{mailing.name}</p>
                      <p className="text-xs text-muted-foreground">v{mailing.currentVersion} · {new Date(mailing.updatedAt).toLocaleDateString("es-CL")}</p>
                    </button>
                  ))}
                </div>
                {versions.length ? (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Versiones</p>
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-start justify-between gap-2 text-xs">
                        <div>
                          <p className="font-medium text-foreground">v{version.versionNumber}</p>
                          <p className="text-muted-foreground">{version.note || "Sin nota"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{new Date(version.createdAt).toLocaleDateString("es-CL")}</span>
                          <Button size="icon" variant="ghost" onClick={() => handleRestoreVersion(version.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Canvas visual</p>
                  <p className="text-xs text-muted-foreground">{document.name} · {document.blocks.length} bloques · {document.settings.width}px</p>
                </div>
                <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as typeof previewMode)}>
                  <TabsList>
                    <TabsTrigger value="canvas"><PenSquare className="mr-2 h-4 w-4" />Canvas</TabsTrigger>
                    <TabsTrigger value="split"><Eye className="mr-2 h-4 w-4" />Split</TabsTrigger>
                    <TabsTrigger value="html"><CodeXml className="mr-2 h-4 w-4" />HTML</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <ScrollArea className="h-full">
              <div className="p-6">
                <div className={`grid gap-4 ${previewMode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                  {previewMode !== "html" ? (
                    <div
                      className="mx-auto min-h-full w-full space-y-4 rounded-md border border-dashed border-border bg-background p-4"
                      style={{ maxWidth: `${document.settings.width + 32}px` }}
                    >
                      <div className="mx-auto space-y-4" style={{ width: `${document.settings.width}px`, maxWidth: "100%" }}>
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
                                <BlockView block={block} isSelected={isSelected} onChange={updateSelectedBlock} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {previewMode !== "canvas" ? (
                    <div className="space-y-4">
                      <div className="rounded-md border border-border bg-background">
                        <iframe
                          title="HTML preview"
                          className="h-[520px] w-full rounded-md"
                          srcDoc={htmlPreview}
                        />
                      </div>
                      <div className="rounded-md border border-border bg-background p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Compatibilidad email</p>
                          <span className="text-xs text-muted-foreground">Score {compatibility.score}/100</span>
                        </div>
                        <div className="space-y-2">
                          {compatibility.issues.length ? compatibility.issues.map((issue) => (
                            <div key={issue.id} className="rounded-md border border-border px-3 py-2 text-xs">
                              <p className="font-medium text-foreground">{issue.severity === "warning" ? "Warning" : "Info"}</p>
                              <p className="text-muted-foreground">{issue.message}</p>
                            </div>
                          )) : <p className="text-xs text-muted-foreground">No se detectaron alertas básicas de compatibilidad.</p>}
                        </div>
                        <pre className="mt-4 max-h-56 overflow-auto rounded-md border border-border bg-secondary/35 p-3 text-[11px] leading-5 text-foreground whitespace-pre-wrap">{htmlPreview}</pre>
                      </div>
                    </div>
                  ) : null}
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