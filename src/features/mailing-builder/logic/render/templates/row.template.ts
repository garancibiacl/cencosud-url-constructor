/**
 * Templates de Row y Column para el sistema de layout de 12 columnas.
 *
 * rowTemplate:    genera la tabla horizontal que aloja las columnas
 * columnTemplate: genera cada celda <td> con su tabla interna de bloques
 *
 * Los comentarios <!--[if mso]> aseguran que Outlook respete los anchos fijos
 * de cada columna en lugar de redistribuirlos automáticamente.
 */

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

export interface RowTemplateData {
  /** Color de fondo de la fila ya resuelto. */
  rowBg: string;
  /** Estilo de padding inline ya construido (ej: "padding:8px 0;") o "". */
  rowPadStyle: string;
  /** Ancho total de la tabla en px (= document.settings.width). */
  totalWidth: number;
  /** HTML de todas las columnas ya renderizado. */
  columnsHtml: string;
}

export function rowTemplate({ rowBg, rowPadStyle, totalWidth, columnsHtml }: RowTemplateData): string {
  return `<tr>
  <td style="${rowPadStyle}background-color:${rowBg};">
    <!--[if mso]>
    <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="${totalWidth}">
      <tr>
    <![endif]-->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        ${columnsHtml}
      </tr>
    </table>
    <!--[if mso]>
      </tr>
    </table>
    <![endif]-->
  </td>
</tr>`;
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

export interface ColumnTemplateData {
  /** Ancho de la columna en px (calculado por proporción de colSpan). */
  columnWidth: number;
  /** Color de fondo de la columna ya resuelto. */
  colBg: string;
  /** Estilo de padding inline ya construido o "". */
  colPadStyle: string;
  /** HTML de todos los bloques de la columna ya renderizado. */
  blocksHtml: string;
}

export function columnTemplate({
  columnWidth,
  colBg,
  colPadStyle,
  blocksHtml,
}: ColumnTemplateData): string {
  const innerHtml = blocksHtml || '<tr><td style="height:16px; line-height:16px; font-size:0;">&nbsp;</td></tr>';

  return `<td width="${columnWidth}" valign="top" align="left"
   style="width:${columnWidth}px; max-width:${columnWidth}px; ${colPadStyle}background-color:${colBg};">
  <!--[if mso]>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${columnWidth}">
    <tr><td>
  <![endif]-->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
    ${innerHtml}
  </table>
  <!--[if mso]>
    </td></tr>
  </table>
  <![endif]-->
</td>`;
}
