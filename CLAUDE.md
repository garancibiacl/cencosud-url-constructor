# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # Run ESLint
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run preview      # Preview production build
```

## Architecture Overview

Local-first, no-backend marketing tool for Cencosud retail brands (Paris, Jumbo, Santa Isabel, SISA). All processing happens client-side using HTML5 Canvas and IndexedDB.

### Two Main Modules

**1. URL Builder** (`src/components/URLBuilder.tsx` — ~1984 lines)
- Generates promotional URLs with structured `?nombre_promo=` query parameters
- Supports individual and batch/bulk URL processing
- Core logic in `src/lib/url-builder.ts` (URL assembly) and `src/hooks/useUrlHydrator.ts` (batch processing)
- Slug generation via `cleanTextToSlug()` — removes Spanish stopwords, normalizes accents
- Week/date utilities in `src/lib/week-options.ts` (ISO week calculation with es-CL locale)
- App-specific title cleaning in `src/lib/title-url-app.ts`

**URL parameter structure (`URLParams`):**
```typescript
{ ubicacion, componente, campana, descripcion, semana, fecha }
// Assembled as: ubicacion-componente-campana-descripcion-semana-fecha
```

**2. Image Optimizer** (`src/components/ImageOptimizer.tsx` — ~995 lines)
- Adapts banner images to brand/device format presets defined in `src/lib/image-presets.ts`
- Focal point editor (click/drag) controls crop origin — stored as `{ x, y }` percentages
- Export pipeline in `src/lib/image-processor.ts`: `cropWithFocalPoint()` → `exportOptimized()` — reduces JPEG quality iteratively until under preset `maxWeightKb`
- Preview uses CSS `object-position` synced to focal point (no canvas for preview)
- Session history stored in IndexedDB via `src/lib/optimizer-history.ts`
- Batch queue: multiple images processed sequentially, downloaded as ZIP via JSZip

**Preset structure:**
- Each preset defines `desktop` and `mobile` dimensions + `maxWeightKb` + optional `safeZone`, `variants`, `focalPointTuning`
- App-only presets use explicit `variants: [{ id: "app", ... }]` instead of desktop/mobile
- `HIDDEN_PRESET_KEYS` in `ImageOptimizer.tsx` hides legacy presets from the selector UI

### Key Patterns

- **State:** Local `useState` + custom hooks; no global store
- **UI:** shadcn-ui (Radix UI primitives) in `src/components/ui/`
- **Styling:** Tailwind CSS — all class-based, no CSS modules
- **Localization:** Spanish (es / es-CL) throughout — labels, date formatting, stopwords
- **Output format:** Always JPEG (`.jpg`), enforced in `image-processor.ts` via `FORCED_OUTPUT_FORMAT`

### Component Size Note

`URLBuilder.tsx` (~1984 lines) and `ImageOptimizer.tsx` (~995 lines) are intentionally large, monolithic components. Extend them in place rather than splitting unless there is a clear reason.
