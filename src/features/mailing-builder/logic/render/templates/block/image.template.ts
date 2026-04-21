/**
 * Template HTML del bloque Image.
 *
 * Si `href` está presente, envuelve la imagen en un <a>.
 * Todos los valores llegan ya escapados y procesados.
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
  const img = `<img src="${src}" alt="${alt}" width="100%"
     style="display:block; width:100%; height:auto; max-width:100%; border:0;" />`;

  const content = href
    ? `<a href="${href}" style="text-decoration:none; display:block;">${img}</a>`
    : img;

  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor};">
    ${content}
  </td>
</tr>`;
}
