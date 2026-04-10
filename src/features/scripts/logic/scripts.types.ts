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
}
