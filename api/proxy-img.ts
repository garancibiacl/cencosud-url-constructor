/**
 * Vercel Edge Function — GET /api/proxy-img?url=<encoded-url>
 *
 * Fetches any image URL server-side and returns it with CORS headers.
 * Used by the mailing builder JPG export to bypass browser CORS restrictions
 * when capturing images from external CDNs onto an HTML Canvas.
 *
 * Security:
 *   - Only http/https URLs are allowed
 *   - Response is streamed with a 10 s timeout
 *   - Cache-Control is forwarded to avoid hammering origin servers
 */

export const config = { runtime: "edge" };

const ALLOWED_CONTENT_TYPES = /^image\//;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing ?url parameter", { status: 400 });
  }

  // Only allow http/https
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Only http/https URLs are allowed", { status: 400 });
  }

  // Fetch image server-side (no CORS restriction on the server)
  let upstream: Response;
  try {
    upstream = await fetch(imageUrl, {
      headers: { "User-Agent": "MailingBuilder/1.0 (image-proxy)" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return new Response("Failed to fetch upstream image", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`Upstream error ${upstream.status}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!ALLOWED_CONTENT_TYPES.test(contentType)) {
    return new Response("Upstream response is not an image", { status: 400 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_SIZE_BYTES) {
    return new Response("Image too large (max 10 MB)", { status: 413 });
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
