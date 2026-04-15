export type ScriptApp = "Illustrator" | "Photoshop" | "InDesign";

export interface IllustratorScript {
  id: string;
  title: string;
  description: string;
  /** Comando/prompt que se le dio a la IA para generar el script */
  prompt: string;
  /** Código JSX listo para ejecutar */
  code: string;
  /** Nombre del archivo al descargar */
  filename: string;
  /** App de Adobe donde se ejecuta */
  app: ScriptApp;
  tags: string[];
  /** Nombre del usuario que subió el script (solo scripts cargados) */
  uploadedBy?: string;
  /** Fecha de carga ISO (solo scripts cargados) */
  uploadedAt?: string;
  /** Nombre del usuario que realizó la última edición */
  updatedBy?: string;
  /** Fecha de última edición ISO */
  updatedAt?: string;
}
