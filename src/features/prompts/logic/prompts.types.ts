export type PromptCategory =
  | "imagen-producto"
  | "banner-campaña"
  | "relleno-generativo"
  | "copy-marketing"
  | "social-media";

export type PromptBrand = "Jumbo" | "Santa Isabel" | "Spid";

export type PromptTone = "formal" | "casual" | "urgente" | "aspiracional";

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  brand: PromptBrand;
  tone: PromptTone;
  tags: string[];
  /** El texto listo para copiar y usar en el modelo de IA */
  content: string;
  /** Si aplica, parámetros editables dentro del prompt (entre {{llaves}}) */
  variables?: string[];
  /** Modelo recomendado para este prompt */
  model?: string;
}

export interface PromptFilters {
  search: string;
  category: PromptCategory | "todas";
  brand: PromptBrand | "todas";
  tone: PromptTone | "todos";
}
