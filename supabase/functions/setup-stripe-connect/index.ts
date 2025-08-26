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

    // Get or create profile
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erreur de profil utilisateur" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          account_type: "business"
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating profile:", createError);
        return new Response(
          JSON.stringify({ error: "Erreur de création de profil" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }
      profile = newProfile;
    }

    // Create or get Stripe Connect account
    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      console.log("📝 Creating new Stripe Connect account...");
      
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
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
    const origin = req.headers.get("origin") || "http://localhost:8080";
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/stripe-connect-setup`,
      return_url: `${origin}/stripe-connect-setup`,
      type: "account_onboarding",
    });

    console.log("✅ Created onboarding link");

    return new Response(
      JSON.stringify({
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