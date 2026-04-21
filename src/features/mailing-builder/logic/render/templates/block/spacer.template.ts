/**
 * Template HTML del bloque Spacer.
 *
 * Usa div con height fijo + &nbsp; para compatibilidad con Outlook
 * (que ignora divs vacíos).
 */

export interface SpacerTemplateData {
  /** Altura en px del espaciado. */
  height: number;
}

export function spacerTemplate({ height }: SpacerTemplateData): string {
  return `<tr>
  <td style="padding:0; background:transparent; line-height:0; font-size:0;" height="${height}">
    <div style="line-height:${height}px; height:${height}px; font-size:${height}px;">&nbsp;</div>
  </td>
</tr>`;
}
