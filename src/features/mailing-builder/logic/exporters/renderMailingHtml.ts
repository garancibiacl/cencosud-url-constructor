import type { ButtonBlock, HeroBlock, ImageBlock, MailingBlock, SpacerBlock, TextBlock } from "../schema/block.types";
import type { MailingDocument } from "../schema/mailing.types";

const FALLBACK_COLORS = {
  background: "#f5f7fb",
  content: "#ffffff",
  foreground: "#0f172a",
  muted: "#475569",
  primary: "#0341a5",
  primaryForeground: "#ffffff",
  secondary: "#e2e8f0",
  border: "#dbe4f0",
};

const resolveColor = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  if (value.includes("var(--background)")) return FALLBACK_COLORS.background;
  if (value.includes("var(--card)")) return FALLBACK_COLORS.content;
  if (value.includes("var(--foreground)")) return FALLBACK_COLORS.foreground;
  if (value.includes("var(--muted-foreground)")) return FALLBACK_COLORS.muted;
  if (value.includes("var(--primary-foreground)")) return FALLBACK_COLORS.primaryForeground;
  if (value.includes("var(--primary)")) return FALLBACK_COLORS.primary;
  if (value.includes("var(--secondary)")) return FALLBACK_COLORS.secondary;
  if (value.includes("var(--border)")) return FALLBACK_COLORS.border;
  return value;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeUrl = (value?: string) => {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("mailto:")) return value;
  return `https://${value}`;
};

const getPadding = (block: MailingBlock) => ({
  top: block.layout.padding?.top ?? 0,
  right: block.layout.padding?.right ?? 0,
  bottom: block.layout.padding?.bottom ?? 0,
  left: block.layout.padding?.left ?? 0,
});

const wrapBlock = (block: MailingBlock, inner: string, backgroundColor?: string) => {
  const padding = getPadding(block);
  const bg = resolveColor(backgroundColor ?? block.layout.backgroundColor, "transparent");

  return `
    <tr>
      <td style="padding:${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px; background:${bg};">
        ${inner}
      </td>
    </tr>
  `;
};

const renderHero = (block: HeroBlock) => {
  const title = escapeHtml(block.props.title);
  const subtitle = block.props.subtitle ? `<p style="margin:0; font-size:16px; line-height:24px; color:${FALLBACK_COLORS.muted};">${escapeHtml(block.props.subtitle)}</p>` : "";
  const cta = block.props.ctaLabel
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
        <tr>
          <td bgcolor="${FALLBACK_COLORS.primary}" style="border-radius:6px;">
            <a href="${escapeHtml(sanitizeUrl(block.props.href))}" style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:${FALLBACK_COLORS.primaryForeground}; text-decoration:none;">${escapeHtml(block.props.ctaLabel)}</a>
          </td>
        </tr>
      </table>
    `
    : "";

  return wrapBlock(
    block,
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <img src="${escapeHtml(block.props.imageUrl || "/placeholder.svg")}" alt="${title}" width="100%" style="display:block; width:100%; height:auto; border:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;">
            <h1 style="margin:0 0 12px; font-size:32px; line-height:36px; font-weight:700; color:${FALLBACK_COLORS.foreground};">${title}</h1>
            ${subtitle}
            ${cta}
          </td>
        </tr>
      </table>
    `,
  );
};

const renderText = (block: TextBlock) =>
  wrapBlock(
    block,
    `
      <div style="font-size:${block.props.fontSize ?? 16}px; line-height:${block.props.lineHeight ?? 24}px; color:${FALLBACK_COLORS.foreground}; text-align:${block.props.align ?? "left"};">
        ${block.props.html}
      </div>
    `,
  );

const renderImage = (block: ImageBlock) => {
  const image = `<img src="${escapeHtml(block.props.src || "/placeholder.svg")}" alt="${escapeHtml(block.props.alt || "Imagen")}" width="100%" style="display:block; width:100%; height:auto; border:0;" />`;
  const content = block.props.href
    ? `<a href="${escapeHtml(sanitizeUrl(block.props.href))}" style="text-decoration:none;">${image}</a>`
    : image;

  return wrapBlock(block, content);
};

const renderButton = (block: ButtonBlock) => {
  const align = block.props.align === "left" ? "left" : block.props.align === "right" ? "right" : "center";
  return wrapBlock(
    block,
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="${align}">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${FALLBACK_COLORS.primary}" style="border-radius:6px;">
                  <a href="${escapeHtml(sanitizeUrl(block.props.href))}" style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:${FALLBACK_COLORS.primaryForeground}; text-decoration:none;">${escapeHtml(block.props.label)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  );
};

const renderSpacer = (block: SpacerBlock) =>
  wrapBlock(block, `&nbsp;`, "transparent").replace("&nbsp;", `<div style="line-height:${block.props.height}px; height:${block.props.height}px;">&nbsp;</div>`);

const renderBlock = (block: MailingBlock) => {
  switch (block.type) {
    case "hero":
      return renderHero(block);
    case "text":
      return renderText(block);
    case "image":
      return renderImage(block);
    case "button":
      return renderButton(block);
    case "spacer":
      return renderSpacer(block);
    default:
      return "";
  }
};

export const renderMailingHtml = (document: MailingDocument) => {
  const subject = escapeHtml(document.settings.subject || document.name);
  const preheader = escapeHtml(document.settings.preheader || "");
  const bodyBackground = resolveColor(document.settings.backgroundColor, FALLBACK_COLORS.background);
  const contentBackground = resolveColor(document.settings.contentBackgroundColor, FALLBACK_COLORS.content);

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background:${bodyBackground}; font-family:${document.settings.fontFamily};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bodyBackground}; margin:0; padding:24px 0; width:100%;">
      <tr>
        <td align="center">
          <table role="presentation" width="${document.settings.width}" cellpadding="0" cellspacing="0" border="0" style="width:${document.settings.width}px; max-width:${document.settings.width}px; background:${contentBackground}; margin:0 auto;">
            ${document.blocks.map(renderBlock).join("\n")}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};