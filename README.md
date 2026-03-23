# Cencosud URL Constructor

Herramienta interna de marketing para el grupo Cencosud (Paris, Jumbo, Santa Isabel, SISA). Genera URLs promocionales estandarizadas y adapta imágenes banner a los formatos oficiales de cada marca y dispositivo.

## Módulos

### Constructor de URLs
Genera URLs con el parámetro `?nombre_promo=` a partir de parámetros estructurados (ubicación, componente, campaña, semana, fecha). Soporta modo individual y procesamiento en lote.

### Optimizador de Imágenes
Recorta y exporta imágenes maestras a los formatos Desktop/Mobile/App de cada preset de Cencosud. Usa un editor de punto focal (clic/arrastrar) para controlar el recorte. Exporta siempre a JPEG con reducción automática de calidad hasta cumplir el peso máximo del preset. Incluye historial local en IndexedDB y descarga en ZIP.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS + shadcn-ui** (Radix UI)
- **Vitest** (unit tests) · **Playwright** (e2e)
- **JSZip** · **date-fns** · **Framer Motion**

## Desarrollo

```sh
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción
npm run lint      # ESLint
npm run test      # tests unitarios (Vitest)
```

## Presets disponibles

Los presets están definidos en `src/lib/image-presets.ts` y cubren:

| Categoría | Ejemplos |
|-----------|---------|
| Web y Retail | Huincha (2088×198), Banner Principal (1920×364), Carrusel Ofertas (652×352) |
| Jumbo App | Banner Principal 3X (1032×399), Banner Doble 2X (332×332), Huincha 2X (686×120) |
| SISA App | Banner Principal 3X, Banner Secundario, Shortcuts, Huincha 2X |

Todos los outputs son `.jpg` con peso máximo por preset (100–250 KB).
