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
    
    // List all available env vars for debugging
    console.log("🔧 Available env vars:", Object.keys(Deno.env.toObject()));
    
    // Initialize Stripe first to check the key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("🔑 Stripe key status:", stripeKey ? `Present (${stripeKey.substring(0, 7)}...)` : "Missing");
    
    if (!stripeKey) {
      console.error("❌ All env vars:", Deno.env.toObject());
      throw new Error("Configuration Stripe manquante. Veuillez contacter le support.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    console.log("✅ Stripe initialized successfully");

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    console.log("✅ Supabase client initialized");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header provided");
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 Extracting user from token...");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("❌ Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!data.user?.email) {
      console.error("❌ No user or email found");
      throw new Error("User not authenticated or email not available");
    }

    const user = data.user;
    console.log(`👤 User authenticated: ${user.id} (${user.email})`);

    // Check if user is a business user - check both user_metadata and app_metadata
    const isBusinessUser = user.user_metadata?.account_type === "business" || 
                           user.app_metadata?.account_type === "business";
    
    if (!isBusinessUser) {
      console.error("❌ User is not a business user", { 
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      });
      throw new Error("Only business users can create Stripe Connect accounts");
    }
    console.log("✅ Business user verified");

    // Check if user already has a Connect account
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id, first_name, last_name, email")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("❌ Profile fetch error:", profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }
    
    console.log("👤 Profile data:", {
      hasProfile: !!profile,
      existingAccountId: profile?.stripe_connect_account_id
    });

    let accountId = profile?.stripe_connect_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log("🔨 Creating new Stripe Connect account...");
      
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR", // France
        email: user.email,
        business_profile: {
          name: user.user_metadata?.company_name || `${profile?.first_name} ${profile?.last_name}`,
          support_email: user.email,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log(`✅ Stripe Connect account created: ${accountId}`);

      // Save account ID to profile
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("⚠️ Failed to save Stripe Connect account ID:", updateError);
      } else {
        console.log("✅ Account ID saved to profile");
      }
    } else {
      console.log(`✅ Using existing Stripe Connect account: ${accountId}`);
    }

    // Create onboarding link
    console.log("🔗 Creating onboarding link...");
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/stripe-connect-setup?refresh=true`,
      return_url: `${origin}/stripe-connect-setup?setup=complete`,
      type: "account_onboarding",
    });

    console.log(`✅ Onboarding link created: ${accountLink.url}`);

    return new Response(JSON.stringify({ 
      account_id: accountId,
      onboarding_url: accountLink.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("💥 Stripe Connect setup error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check the server logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});