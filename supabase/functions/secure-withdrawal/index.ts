import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("💰 Processing withdrawal request...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Configuration manquante" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    // Initialize Supabase with anon key for auth, service role for operations
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user with the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Invalid user token:", userError);
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    console.log("✅ User authenticated:", user.id);

    // Get request body
    const { businessUserId, amount } = await req.json();

    // Verify user matches business user ID
    if (user.id !== businessUserId) {
      return new Response(
        JSON.stringify({ error: "Non autorisé pour cette entreprise" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403
        }
      );
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Montant invalide" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    console.log(`💸 Processing withdrawal of €${amount} for user ${businessUserId}`);

    // Call the secure withdrawal function
    const { data: withdrawalResult, error: withdrawalError } = await supabaseService
      .rpc('secure_request_withdrawal', {
        p_business_user_id: businessUserId,
        p_amount: amount
      });

    if (withdrawalError) {
      console.error("❌ Withdrawal error:", withdrawalError);
      return new Response(
        JSON.stringify({ 
          error: withdrawalError.message || "Erreur lors de la demande de retrait"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    console.log("✅ Withdrawal processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Demande de retrait de €${amount} traitée avec succès`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur inattendue s'est produite",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});