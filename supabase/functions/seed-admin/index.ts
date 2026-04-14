import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create admin user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@admin.cl",
    password: "1234",
    email_confirm: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Set role to admin
  const { error: roleError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);

  return new Response(
    JSON.stringify({ success: true, user_id: data.user.id, role_update_error: roleError?.message }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
