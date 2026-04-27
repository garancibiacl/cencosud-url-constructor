import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

/** Dev-only middleware that mirrors the /api/proxy-img Vercel Edge Function. */
function imgProxyPlugin(): Plugin {
  return {
    name: "img-proxy",
    configureServer(server) {
      server.middlewares.use("/api/proxy-img", async (req, res) => {
        const qs  = req.url?.split("?")[1] ?? "";
        const url = new URLSearchParams(qs).get("url");
        if (!url) { res.statusCode = 400; return res.end("Missing ?url"); }

        try {
          const upstream = await fetch(url, {
            headers: { "User-Agent": "MailingBuilder/1.0 (img-proxy-dev)" },
          });
          if (!upstream.ok) { res.statusCode = 502; return res.end(`Upstream ${upstream.status}`); }
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.end(buf);
        } catch (e) {
          res.statusCode = 502;
          res.end("Proxy fetch error");
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), imgProxyPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
}));
