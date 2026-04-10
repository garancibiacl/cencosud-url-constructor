import type { IllustratorScript } from "./scripts.types";

// Vite importa el archivo como string plano gracias a ?raw
import redondearCode from "../data/RedondearMesas.jsx?raw";
import renombrarCode from "../data/RenombrarMesasPorMedidas.jsx?raw";

/**
 * Catálogo de scripts.
 * Para agregar uno nuevo:
 *  1. Agrega el .jsx en src/features/scripts/data/
 *  2. Importa con ?raw arriba
 *  3. Agrega la entrada al array
 */
export const SCRIPTS_CATALOG: IllustratorScript[] = [
  {
    id: "illus-redondear-mesas",
    title: "Redondear mesas de trabajo",
    description:
      "Elimina los decimales de todas las mesas de trabajo del documento activo, redondeando cada coordenada al entero más cercano.",
    prompt:
      "Crea un script para Adobe Illustrator que recorra todas las mesas de trabajo del documento activo y redondee sus coordenadas (left, top, right, bottom) al número entero más cercano, eliminando los decimales. Al terminar, muestra un alert confirmando que se realizó el ajuste.",
    code: redondearCode,
    filename: "RedondearMesas.jsx",
    app: "Illustrator",
    tags: ["mesas de trabajo", "redondear", "medidas", "decimales", "artboards"],
  },
  {
    id: "illus-renombrar-mesas",
    title: "Renombrar mesas por medidas",
    description:
      "Renombra automáticamente todas las mesas de trabajo con el formato anchoxalto_ (ej: 1080x1920_), calculando las dimensiones reales en píxeles.",
    prompt:
      "Crea un script para Adobe Illustrator que recorra todas las mesas de trabajo del documento activo y las renombre usando el formato anchoxalto_ (por ejemplo: 1080x1920_). El ancho y alto deben calcularse desde artboardRect y redondearse al entero más cercano. Al terminar, muestra un alert de confirmación.",
    code: renombrarCode,
    filename: "RenombrarMesasPorMedidas.jsx",
    app: "Illustrator",
    tags: ["mesas de trabajo", "renombrar", "medidas", "artboards", "nomenclatura"],
  },
];
