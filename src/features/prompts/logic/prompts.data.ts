import type { Prompt } from "./prompts.types";

/**
 * Catálogo estático de prompts.
 * Agregar nuevos prompts aquí — el servicio los indexa automáticamente.
 */
export const PROMPTS_CATALOG: Prompt[] = [
  // ── Imagen de producto ────────────────────────────────────────────────────
  {
    id: "img-prod-blanco-01",
    title: "Producto sobre fondo blanco limpio",
    description: "Ideal para fichas de producto en ecommerce.",
    category: "imagen-producto",
    brand: "Generico",
    tone: "formal",
    tags: ["producto", "ecommerce", "fondo blanco", "ficha"],
    model: "DALL-E 3",
    content:
      "Product photography of {{nombre_producto}} on a pure white background, studio lighting, " +
      "sharp focus, high resolution, no shadows, centered composition, professional commercial look.",
    variables: ["nombre_producto"],
  },
  {
    id: "img-prod-lifestyle-01",
    title: "Producto en contexto lifestyle",
    description: "Producto integrado en un ambiente cotidiano y aspiracional.",
    category: "imagen-producto",
    brand: "Generico",
    tone: "aspiracional",
    tags: ["lifestyle", "ambiente", "aspiracional"],
    model: "DALL-E 3",
    content:
      "Lifestyle photography of {{nombre_producto}} in a {{ambiente}} setting, natural light, " +
      "warm tones, photorealistic, editorial style, subtle depth of field.",
    variables: ["nombre_producto", "ambiente"],
  },

  // ── Banner campaña ────────────────────────────────────────────────────────
  {
    id: "banner-paris-sale-01",
    title: "Banner oferta Paris — desktop",
    description: "Banner horizontal para campaña de descuentos Paris.",
    category: "banner-campaña",
    brand: "Paris",
    tone: "urgente",
    tags: ["banner", "descuento", "desktop", "paris"],
    model: "DALL-E 3",
    content:
      "Wide promotional banner for Paris department store, bold discount text '{{descuento}}% OFF', " +
      "elegant dark blue and white color palette (#003087), clean modern layout, product image of " +
      "{{nombre_producto}} on the right, call-to-action button, 1920x600px ratio.",
    variables: ["descuento", "nombre_producto"],
  },
  {
    id: "banner-jumbo-fresh-01",
    title: "Banner Jumbo — frescos y alimentos",
    description: "Banner de supermercado para sección de frescos.",
    category: "banner-campaña",
    brand: "Jumbo",
    tone: "casual",
    tags: ["banner", "frescos", "alimentos", "jumbo"],
    model: "DALL-E 3",
    content:
      "Supermarket promotional banner for Jumbo grocery store, fresh {{categoria_producto}} displayed " +
      "on a bright green background (#00A651), vibrant colors, appetizing food photography, " +
      "price tag showing {{precio}}, friendly and approachable style.",
    variables: ["categoria_producto", "precio"],
  },
  {
    id: "banner-santa-isabel-01",
    title: "Banner Santa Isabel — oferta semanal",
    description: "Estilo cercano y económico característico de Santa Isabel.",
    category: "banner-campaña",
    brand: "Santa Isabel",
    tone: "urgente",
    tags: ["banner", "oferta semanal", "santa isabel"],
    model: "DALL-E 3",
    content:
      "Promotional banner for Santa Isabel supermarket, weekly deal on {{nombre_producto}}, " +
      "orange and red color scheme, bold price '{{precio}}', starburst sale badge, " +
      "neighborhood store feel, Chilean market style.",
    variables: ["nombre_producto", "precio"],
  },

  // ── Relleno generativo ────────────────────────────────────────────────────
  {
    id: "relleno-cocina-01",
    title: "Expansión: cocina moderna",
    description: "Rellena bordes de un banner con fondo de cocina.",
    category: "relleno-generativo",
    brand: "Generico",
    tone: "aspiracional",
    tags: ["outpainting", "cocina", "expansión", "fondo"],
    model: "DALL-E 2",
    content:
      "Modern kitchen background, clean white countertops, marble surfaces, soft natural light " +
      "from window, blurred background, photorealistic, seamless extension of existing image.",
  },
  {
    id: "relleno-supermercado-01",
    title: "Expansión: pasillo supermercado",
    description: "Amplía la imagen con un pasillo genérico de super.",
    category: "relleno-generativo",
    brand: "Generico",
    tone: "formal",
    tags: ["outpainting", "supermercado", "pasillo"],
    model: "DALL-E 2",
    content:
      "Supermarket aisle background, well-lit shelves with products, clean retail environment, " +
      "photorealistic, seamless continuation of the existing image edges.",
  },

  // ── Copy marketing ────────────────────────────────────────────────────────
  {
    id: "copy-promo-urgencia-01",
    title: "Copy de urgencia — oferta por tiempo limitado",
    description: "Texto persuasivo con escasez y tiempo limitado.",
    category: "copy-marketing",
    brand: "Generico",
    tone: "urgente",
    tags: ["copy", "urgencia", "descuento", "cta"],
    content:
      "Escribe un copy de marketing en español para {{tienda}} promocionando {{nombre_producto}} " +
      "con {{descuento}}% de descuento. Tono urgente, máximo 3 oraciones, incluye llamada a la acción " +
      "clara. Resalta que la oferta termina el {{fecha_fin}}. Sin emojis.",
    variables: ["tienda", "nombre_producto", "descuento", "fecha_fin"],
  },
  {
    id: "copy-descripcion-producto-01",
    title: "Descripción de producto para ecommerce",
    description: "Copy persuasivo para ficha de producto.",
    category: "copy-marketing",
    brand: "Generico",
    tone: "formal",
    tags: ["copy", "descripción", "ecommerce", "seo"],
    content:
      "Escribe una descripción de producto en español para {{nombre_producto}} de la marca {{marca}}. " +
      "Incluye: beneficio principal, características clave (3 bullet points), y una llamada a la acción. " +
      "Tono {{tono}}, máximo 150 palabras, orientado a SEO para retail chileno.",
    variables: ["nombre_producto", "marca", "tono"],
  },

  // ── Social media ──────────────────────────────────────────────────────────
  {
    id: "social-instagram-paris-01",
    title: "Post Instagram — Paris moda",
    description: "Caption para publicación de moda en Instagram.",
    category: "social-media",
    brand: "Paris",
    tone: "aspiracional",
    tags: ["instagram", "moda", "caption", "paris"],
    content:
      "Escribe un caption para Instagram de Paris tienda, promocionando {{nombre_producto}} de la " +
      "colección {{coleccion}}. Tono aspiracional y elegante, máximo 2 párrafos, 3-5 hashtags " +
      "relevantes en español, incluye un emoji sutil. Dirigido a mujer chilena 25-45 años.",
    variables: ["nombre_producto", "coleccion"],
  },
  {
    id: "social-jumbo-receta-01",
    title: "Post receta — Jumbo",
    description: "Caption con receta para redes sociales de Jumbo.",
    category: "social-media",
    brand: "Jumbo",
    tone: "casual",
    tags: ["instagram", "receta", "alimentos", "jumbo"],
    content:
      "Escribe un post de receta para redes sociales de Jumbo usando {{ingrediente_principal}} " +
      "como protagonista. Incluye: título atractivo, lista de ingredientes corta (max 6), " +
      "pasos simples (max 4), y 3 hashtags. Tono cercano y familiar, en español chileno.",
    variables: ["ingrediente_principal"],
  },
];
