import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS = [
  "german@estoesagua.cl",
  "emerson@estoesagua.cl",
  "italo@estoesagua.cl",
  "daniel@estoesagua.cl",
  "carolina@estoesagua.cl",
  "felipe@estoesagua.cl",
  "valentina@estoesagua.cl",
  "ricardo@estoesagua.cl",
  "katherine@estoesagua.cl",
  "jose@estoesagua.cl",
  "gustavo@estoesagua.cl",
  "natalia@estoesagua.cl",
  "asuncion@estoesagua.cl",
];

const TEMP_PASSWORD = "Agua2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser(token);
  
  if (authErr || !authUser) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", authUser.id).maybeSingle();
    
  if (callerProfile?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Se requiere rol admin" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ email: string; status: string; error?: string }> = [];

  for (const email of USERS) {
    const { data: { users: existing } } = await admin.auth.admin.listUsers();
    const found = existing?.find((u) => u.email === email);

    if (found) {
      const { error } = await admin.auth.admin.updateUserById(found.id, {
        password: TEMP_PASSWORD,
      });
      if (error) {
        results.push({ email, status: "error", error: error.message });
      } else {
        await admin.from("profiles")
          .update({ must_change_password: true })
          .eq("id", found.id);
        results.push({ email, status: "updated" });
      }
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "disenador" }
      });
      if (error) {
        results.push({ email, status: "error", error: error.message });
      } else {
        await admin.from("profiles")
          .upsert({ id: data.user.id, role: "disenador", must_change_password: true });
        results.push({ email, status: "created" });
      }
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const errors = results.filter((r) => r.status === "error").length;

  return new Response(
    JSON.stringify({ summary: { created, updated, errors, total: USERS.length }, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
