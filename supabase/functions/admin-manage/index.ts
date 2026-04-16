import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Admin-only endpoint to update a user's role or reset their password.
 * POST body: { userId, action: "update_role" | "reset_password", role?, newPassword? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  // 1. Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: jsonHeaders });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: jsonHeaders });
  }

  // 2. Admin role check
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: caller } = await adminClient
    .from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();

  if (caller?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Se requiere rol admin" }), { status: 403, headers: jsonHeaders });
  }

  // 3. Parse body
  const { userId, action, role, newPassword } = await req.json();

  if (!userId || !action) {
    return new Response(JSON.stringify({ error: "userId y action son requeridos" }), { status: 400, headers: jsonHeaders });
  }

  // 4. Execute action
  if (action === "update_role") {
    const validRoles = ["admin", "disenador", "programador", "director", "cencosud", "mailing"];
    if (!role || !validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Rol inválido" }), { status: 400, headers: jsonHeaders });
    }
    const { error } = await adminClient.from("profiles").update({ role }).eq("id", userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
    }
    return new Response(JSON.stringify({ success: true, action: "role_updated", role }), { headers: jsonHeaders });
  }

  if (action === "reset_password") {
    const password = newPassword || "Agua2026!";
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
    }
    await adminClient.from("profiles").update({ must_change_password: true }).eq("id", userId);
    return new Response(JSON.stringify({ success: true, action: "password_reset" }), { headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ error: "Acción no reconocida" }), { status: 400, headers: jsonHeaders });
});
