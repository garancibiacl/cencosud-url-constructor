export type BrandId = "santa-isabel" | "jumbo";

export interface BrandTheme {
  id: BrandId;
  name: string;
  primaryColor: string;
  primaryForeground: string;
  fontFamily: string;
  websiteUrl: string;
}

export interface BrandShell {
  /** CSS adicional (font imports, compat Outlook específico de marca). */
  css: string;
  /** HTML completo del header (logo + nav + saludo con AMPscript). */
  header: string;
  /** HTML completo del footer (legales + app + redes sociales). */
  footer: string;
  /** Si true, inyecta meta tags SFMC en <head>. */
  sfmc: boolean;
}
