# Cómo agregar un nuevo módulo en 3 pasos

Copia esta carpeta, renómbrala, y sigue los pasos:

---

## Paso 1 — Crea la feature

```
src/features/<nombre-feature>/
  index.ts          ← barrel: solo exporta lo que el router necesita
  ui/
    <Nombre>Page.tsx  ← componente de página (puede ser grande, está bien)
  logic/            ← funciones puras, sin React
  hooks/            ← hooks de React específicos de esta feature
  services/         ← llamadas a APIs externas
  types.ts          ← todos los tipos de esta feature
```

**Reglas:**
- Nada importa desde otra feature directamente. Si necesitas algo compartido, muévelo a `src/shared/`.
- Los imports desde fuera de la feature siempre van al `index.ts`, nunca a rutas internas.
- `src/shared/` solo para código verdaderamente reutilizable (mínimo 2 features distintas).

---

## Paso 2 — Registra la ruta en el router

En `src/app/router.tsx`:

```tsx
// 1. Agrega el import lazy
const MiFeaturePage = lazy(() => import("@/features/mi-feature/ui/MiFeaturePage"));

// 2. Agrega la ruta dentro del grupo <AppShell>
<Route
  path="/mi-feature"
  element={<Lazy><MiFeaturePage /></Lazy>}
/>
```

---

## Paso 3 — Registra el módulo en el sidebar

En `src/modules/appModules.ts`:

```ts
// 1. Agrega el id al tipo
export type AppModuleId =
  | "constructor-url"
  | "mi-feature"     // ← nuevo
  | ...;

// 2. Agrega la entrada al array (el path debe coincidir con el router)
export const appModules: AppModuleDefinition[] = [
  ...
  {
    id: "mi-feature",
    label: "Mi Feature",
    icon: MiIcono,
    path: "/mi-feature",
  },
];
```

Listo. La feature aparece en el sidebar y tiene su propia ruta con lazy loading.

---

## Estructura interna recomendada para features complejas

```
features/mi-feature/
  index.ts
  types.ts
  ui/
    MiFeaturePage.tsx      ← orquesta la UI
    components/
      MiComponente.tsx     ← subcomponentes locales
  logic/
    miCalculacion.ts       ← puras, testeables
  hooks/
    useMiFeature.ts        ← estado React local
  services/
    miApi.ts               ← fetch / IndexedDB / etc.
```

## ¿Cuándo usar `src/shared/`?

Solo cuando el mismo código se necesita en **2 o más features distintas**.
Si solo lo usa una feature, déjalo dentro de esa feature.

Compartido actual:
- `src/shared/components/ModulePlaceholder.tsx`
