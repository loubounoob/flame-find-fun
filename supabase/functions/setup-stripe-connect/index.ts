import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    console.log("🚀 Starting Stripe Connect setup...");

    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔧 Environment check:");
    console.log("- Stripe key:", stripeKey ? "✅ Available" : "❌ Missing");
    console.log("- Supabase URL:", supabaseUrl ? "✅ Available" : "❌ Missing");
    console.log("- Service key:", supabaseServiceKey ? "✅ Available" : "❌ Missing");

    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY missing");
      return new Response(
        JSON.stringify({ error: "Configuration Stripe manquante - contactez le support" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Configuration serveur manquante" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    console.log("✅ All environment variables found");

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    // Initialize Supabase with service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user with the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

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

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create profile - use upsert approach
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        email: user.email || null,
        account_type: "business"
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creating/updating profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erreur de profil utilisateur" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    console.log("✅ Profile ready:", profile.id);

    // Create or get Stripe Connect account
    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      console.log("📝 Creating new Stripe Connect account...");
      
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log("✅ Created Stripe account:", accountId);

      // Save account ID to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("❌ Error updating profile with account ID:", updateError);
        return new Response(
          JSON.stringify({ error: "Erreur de sauvegarde du compte Stripe" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }
    } else {
      console.log("✅ Using existing Stripe account:", accountId);
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://uxdddiaheswxgkoannri.supabase.co";
    const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash
    
    console.log("🔗 Creating account link with origin:", baseUrl);
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/stripe-connect-setup`,
      return_url: `${baseUrl}/stripe-connect-setup`,
      type: "account_onboarding",
    });

    console.log("✅ Created onboarding link:", accountLink.url);

    return new Response(
      JSON.stringify({
        success: true,
        account_id: accountId,
        onboarding_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Une erreur inattendue s'est produite",
        details: error.message,
        type: error.constructor.name
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});