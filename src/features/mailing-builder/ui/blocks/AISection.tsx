/**
 * AISection
 *
 * Panel del inspector de bloque que expone el flujo AI completo:
 *   SKU input → buscar producto → configurar estilo/calidad → generar → aplicar
 *
 * Se monta dentro de MailingBlockInspectors.tsx, en los tipos de bloque
 * que soportan imagen (hero, image, product, product-dd, banner).
 */

import React, { useCallback, useState } from "react";
import {
  AlertCircle,
  BookImage,
  ChevronDown,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAIGenerator } from "../../hooks/useAIGenerator";
import type { AIBlockFields, AIQuality, AIStyle, BlockType, Brand } from "../../logic/ai/ai.types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AISectionProps {
  blockId: string;
  blockType: BlockType;
  campaignId: string;
  onUpdateBlock: (blockId: string, fields: AIBlockFields & { imageUrl?: string; src?: string }) => void;
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price === null) return "";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price);
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AISection({ blockId, blockType, campaignId, onUpdateBlock }: AISectionProps) {
  const {
    isLoadingProduct,
    isGeneratingImage,
    productData,
    generatedImages,
    selectedImageUrl,
    error,
    fetchProduct,
    generateImage,
    selectVariant,
    reset,
  } = useAIGenerator();

  // Formulario local
  const [sku,     setSku]     = useState("");
  const [brand,   setBrand]   = useState<Brand>("jumbo");
  const [style,   setStyle]   = useState<AIStyle>("auto");
  const [quality, setQuality] = useState<AIQuality>("fast");

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!sku.trim()) return;
    await fetchProduct(sku, brand);
  }, [sku, brand, fetchProduct]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void handleSearch();
    },
    [handleSearch],
  );

  const handleGenerate = useCallback(async () => {
    if (!productData) return;
    await generateImage({ blockType, style, quality, campaignId });
  }, [productData, blockType, style, quality, campaignId, generateImage]);

  // Aplica la variante seleccionada al bloque
  const handleApplyImage = useCallback(
    (imageUrl: string, isAI: boolean) => {
      if (!productData) return;
      const selectedImg = generatedImages.find((img) => img.url === imageUrl);

      const fields: AIBlockFields & { imageUrl?: string; src?: string } = {
        // Campos AI
        aiGenerated:          isAI,
        aiImageUrl:           isAI ? imageUrl : undefined,
        aiPrompt:             selectedImg?.prompt,
        aiGenerationId:       selectedImg?.id,
        // Datos producto
        sku:                  productData.sku,
        productName:          productData.name,
        productPrice:         productData.price,
        productOriginalPrice: productData.originalPrice,
        productDiscount:      productData.discount,
        productImageUrl:      productData.imageUrl,
        productBrand:         productData.brand,
        productCategory:      productData.category,
        productAttributes:    productData.attributes,
        // Campo de imagen nativo del bloque (hero usa imageUrl, image usa src)
        imageUrl,
        src: imageUrl,
      };

      selectVariant(imageUrl);
      onUpdateBlock(blockId, fields);
    },
    [blockId, productData, generatedImages, selectVariant, onUpdateBlock],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
          IA · SKU a imagen
        </span>
      </div>

      {/* SKU + Brand input */}
      <div className="flex gap-1.5">
        <Input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SKU del producto"
          className="h-7 text-xs flex-1 min-w-0"
          disabled={isLoadingProduct || isGeneratingImage}
        />
        <Select value={brand} onValueChange={(v) => setBrand(v as Brand)}>
          <SelectTrigger className="h-7 w-[82px] text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jumbo">Jumbo</SelectItem>
            <SelectItem value="sisa">Sta. Isabel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botón buscar */}
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs w-full"
        onClick={handleSearch}
        disabled={!sku.trim() || isLoadingProduct || isGeneratingImage}
      >
        {isLoadingProduct ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Buscando…
          </>
        ) : (
          <>
            <BookImage className="h-3 w-3 mr-1.5" />
            Buscar producto
          </>
        )}
      </Button>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Card de producto encontrado */}
      {productData && !isLoadingProduct && (
        <>
          <Separator className="my-0.5" />
          <div className="rounded-md border bg-muted/40 p-2 flex gap-2">
            {/* Thumbnail catálogo */}
            {productData.imageUrl ? (
              <img
                src={productData.imageUrl}
                alt={productData.name}
                className="w-12 h-12 object-contain rounded shrink-0 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <p className="text-xs font-medium leading-tight line-clamp-2">{productData.name}</p>
              {productData.category && (
                <p className="text-[10px] text-muted-foreground truncate">{productData.category}</p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {productData.price && (
                  <span className="text-xs font-semibold text-green-600">
                    {formatPrice(productData.price)}
                  </span>
                )}
                {productData.originalPrice && productData.originalPrice !== productData.price && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatPrice(productData.originalPrice)}
                  </span>
                )}
                {productData.discount && productData.discount > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1 py-0">
                    -{productData.discount}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Configuración generación */}
          <Separator className="my-0.5" />

          {/* Estilo */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Estilo
            </span>
            <div className="flex gap-1">
              {(["auto", "lifestyle", "promo"] as AIStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`flex-1 text-[10px] rounded border py-1 transition-colors capitalize ${
                    style === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Calidad */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Calidad
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setQuality("fast")}
                className={`flex-1 flex items-center justify-center gap-1 text-[10px] rounded border py-1 transition-colors ${
                  quality === "fast"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                <Zap className="h-2.5 w-2.5" />
                Rápido
              </button>
              <button
                onClick={() => setQuality("hd")}
                className={`flex-1 flex items-center justify-center gap-1 text-[10px] rounded border py-1 transition-colors ${
                  quality === "hd"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                HD
              </button>
            </div>
          </div>

          {/* Botón generar */}
          <Button
            size="sm"
            className="h-7 text-xs w-full bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleGenerate}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Generando imagen…
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Generar imagen IA
              </>
            )}
          </Button>

          {/* Feedback de progreso */}
          {isGeneratingImage && (
            <div className="text-[10px] text-muted-foreground text-center animate-pulse">
              {quality === "hd"
                ? "HD puede tomar 30-50 segundos…"
                : "Generando variantes…"}
            </div>
          )}

          {/* Grid de variantes generadas */}
          {generatedImages.length > 0 && !isGeneratingImage && (
            <>
              <Separator className="my-0.5" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Variantes generadas
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {generatedImages.map((img) => {
                  const isSelected = selectedImageUrl === img.url;
                  return (
                    <button
                      key={img.id}
                      onClick={() => handleApplyImage(img.url, true)}
                      className={`relative rounded overflow-hidden border-2 transition-all aspect-square ${
                        isSelected
                          ? "border-violet-500 ring-1 ring-violet-500"
                          : "border-border hover:border-violet-400"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Variante ${img.variantIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                          <div className="bg-violet-500 rounded-full p-0.5">
                            <ChevronDown className="h-2.5 w-2.5 text-white rotate-[-90deg]" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0.5 right-0.5">
                        <Badge className="text-[8px] h-3.5 px-1 bg-black/60 text-white border-0">
                          {img.variantIndex + 1}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botón regenerar */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] w-full text-muted-foreground"
                onClick={handleGenerate}
              >
                <RefreshCw className="h-2.5 w-2.5 mr-1" />
                Regenerar variantes
              </Button>
            </>
          )}

          {/* Fallback: usar imagen catálogo */}
          {productData.imageUrl && (
            <>
              {generatedImages.length > 0 && <Separator className="my-0.5" />}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] w-full text-muted-foreground"
                onClick={() => handleApplyImage(productData.imageUrl!, false)}
              >
                <ImageIcon className="h-3 w-3 mr-1.5" />
                Usar imagen del catálogo
              </Button>
            </>
          )}

          {/* Reset */}
          <button
            onClick={reset}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center pt-0.5"
          >
            Buscar otro producto
          </button>
        </>
      )}
    </div>
  );
}
