/**
 * Template HTML del bloque Image.
 *
 * Si `href` está presente, envuelve la imagen en un <a>.
 * Todos los valores llegan ya escapados y procesados.
 *
 * Estándares aplicados:
 *   - border="0" como atributo HTML en <img> (compatibilidad Outlook/legacy)
 *   - style="display:block;border:0;outline:none;text-decoration:none;" en <img>
 *   - target="_blank" en el <a>
 *   - valign="top" en el <td>
 */

export interface ImageTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  /** URL de imagen ya escapada. */
  src: string;
  /** Alt text ya escapado. */
  alt: string;
  /** URL del link ya trackeada y escapada. Cadena vacía si no aplica. */
  href: string;
}

export function imageTemplate({ padding: p, bgColor, src, alt, href }: ImageTemplateData): string {
  const img = `<img src="${src}" alt="${alt}" width="100%" border="0"
     style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;max-width:100%;" />`;

  const content = href
    ? `<a href="${href}" target="_blank" style="text-decoration:none;display:block;line-height:0;">${img}</a>`
    : img;

  return `<tr>
  <td valign="top" style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;background-color:${bgColor};line-height:0;font-size:0;">
    ${content}
  </td>
</tr>`;
}
