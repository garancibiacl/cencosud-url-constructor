import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Edge Function: admin-access-logs
 * Returns all access log entries. Restricted to admin role only.
 * Uses service_role to bypass RLS after verifying the caller is admin.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── 1. Extract Bearer token ──────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "No autenticado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── 2. Validate JWT ──────────────────────────────────────
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claims?.claims) {
    return new Response(
      JSON.stringify({ error: "Token inválido o expirado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claims.claims.sub;

  // ── 3. Verify admin role server-side ─────────────────────
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (callerProfile?.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Sin permisos. Se requiere rol admin." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── 4. Fetch access logs (admin authorized) ──────────────
  const { data: logs, error } = await adminClient
    .from("access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ logs, total: logs?.length ?? 0 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
