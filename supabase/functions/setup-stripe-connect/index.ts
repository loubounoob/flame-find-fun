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
    
    // Get Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ Stripe key missing");
      return new Response(JSON.stringify({ 
        error: "Configuration Stripe manquante. Contactez le support." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    console.log("✅ Stripe key found");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No auth header");
      return new Response(JSON.stringify({ 
        error: "Authentication requise" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user?.email) {
      console.error("❌ Auth failed:", authError);
      return new Response(JSON.stringify({ 
        error: "Session expirée. Reconnectez-vous." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = data.user;
    console.log(`👤 User: ${user.id}`);

    // Check if user is business
    const isBusinessUser = user.user_metadata?.account_type === "business" || 
                           user.app_metadata?.account_type === "business";
    
    if (!isBusinessUser) {
      console.error("❌ Not a business user");
      return new Response(JSON.stringify({ 
        error: "Seuls les comptes entreprise peuvent configurer Stripe Connect" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Get or create profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let accountId = profile?.stripe_connect_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log("🔨 Creating Stripe account...");
      
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log(`✅ Account created: ${accountId}`);

      // Save account ID
      await supabaseClient
        .from("profiles")
        .upsert({ 
          user_id: user.id,
          stripe_connect_account_id: accountId,
          email: user.email
        });
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/stripe-connect-setup?refresh=true`,
      return_url: `${origin}/stripe-connect-setup?setup=complete`,
      type: "account_onboarding",
    });

    console.log(`✅ Onboarding link created`);

    return new Response(JSON.stringify({ 
      account_id: accountId,
      onboarding_url: accountLink.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Error:", error);
    return new Response(JSON.stringify({ 
      error: "Erreur interne. Réessayez plus tard." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});