/**
 * Template HTML del bloque Spacer.
 *
 * Usa <td> con height explícito + &nbsp; + div con height para compatibilidad
 * con Outlook (que ignora divs vacíos pero respeta height en td).
 *
 * Estándares aplicados:
 *   - height como atributo HTML en <td> (Outlook lo requiere)
 *   - font-size y line-height iguales al height para evitar colapso
 *   - valign="top" en el <td>
 */

export interface SpacerTemplateData {
  /** Altura en px del espaciado. */
  height: number;
}

export function spacerTemplate({ height }: SpacerTemplateData): string {
  return `<tr>
  <td valign="top" height="${height}" style="padding:0;background-color:transparent;line-height:${height}px;font-size:${height}px;mso-line-height-rule:exactly;">
    &nbsp;
  </td>
</tr>`;
}
