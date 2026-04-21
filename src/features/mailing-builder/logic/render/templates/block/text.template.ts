/**
 * Template HTML del bloque Text.
 *
 * El campo `html` se inserta sin escape adicional — el caller es responsable
 * de sanitizar el contenido HTML antes de pasar los datos al template.
 */

export interface TextTemplateData {
  padding: { top: number; right: number; bottom: number; left: number };
  bgColor: string;
  /** HTML interno del bloque. Debe estar sanitizado antes de llegar aquí. */
  html: string;
  align: string;
  fontSize: number;
  lineHeight: number;
  color: string;
}

export function textTemplate({
  padding: p,
  bgColor,
  html,
  align,
  fontSize,
  lineHeight,
  color,
}: TextTemplateData): string {
  return `<tr>
  <td style="padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px; background:${bgColor};">
    <div style="font-size:${fontSize}px; line-height:${lineHeight}px; color:${color}; text-align:${align};">
      ${html}
    </div>
  </td>
</tr>`;
}
