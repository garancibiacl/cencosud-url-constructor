export interface MailingCompatibilityIssue {
  id: string;
  severity: "warning" | "info";
  message: string;
}

export interface MailingCompatibilityReport {
  issues: MailingCompatibilityIssue[];
  score: number;
}

const hasRelativeUrl = (html: string, attribute: "href" | "src") => {
  const regex = new RegExp(`${attribute}=["'](?!https?:\\/\\/|mailto:|tel:|#|data:)[^"']+["']`, "i");
  return regex.test(html);
};

export const analyzeMailingHtml = (html: string): MailingCompatibilityReport => {
  const issues: MailingCompatibilityIssue[] = [];

  if (/<style[\s>]/i.test(html)) {
    issues.push({ id: "style-tag", severity: "warning", message: "Evita depender de etiquetas <style>; varios clientes de correo las recortan o ignoran parcialmente." });
  }

  if (/display\s*:\s*flex|position\s*:\s*(absolute|fixed|sticky)|float\s*:/i.test(html)) {
    issues.push({ id: "advanced-layout", severity: "warning", message: "Se detectaron estilos avanzados (flex/position/float) con soporte inconsistente en email." });
  }

  if (/class=/i.test(html)) {
    issues.push({ id: "class-attr", severity: "info", message: "Se detectaron clases CSS; en email suele ser más seguro depender de estilos inline." });
  }

  if (hasRelativeUrl(html, "href") || hasRelativeUrl(html, "src")) {
    issues.push({ id: "relative-url", severity: "warning", message: "Hay URLs relativas; para email conviene usar rutas absolutas en links e imágenes." });
  }

  if (!/role="presentation"/i.test(html)) {
    issues.push({ id: "presentation-role", severity: "info", message: "Usar tablas con role=\"presentation\" mejora la accesibilidad en plantillas HTML para email." });
  }

  if (!/display:none; max-height:0; overflow:hidden/i.test(html)) {
    issues.push({ id: "preheader", severity: "info", message: "No se detectó un preheader oculto optimizado para bandejas de entrada." });
  }

  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - warningCount * 20 - (issues.length - warningCount) * 5);

  return { issues, score };
};