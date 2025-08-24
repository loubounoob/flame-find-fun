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
    console.log("Setting up Stripe Connect...");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!data.user?.email) {
      console.error("No user or email found");
      throw new Error("User not authenticated or email not available");
    }

    const user = data.user;
    console.log(`Processing for user: ${user.id}`);

    // Check if user is a business user
    if (user.user_metadata?.account_type !== "business") {
      throw new Error("Only business users can create Stripe Connect accounts");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    console.log("Stripe initialized successfully");

    // Check if user already has a Connect account
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id, first_name, last_name, email")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Profile fetch error:", profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }
    
    console.log("Profile fetched, existing account ID:", profile?.stripe_connect_account_id);

    let accountId = profile?.stripe_connect_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
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

      // Save account ID to profile
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to save Stripe Connect account ID:", updateError);
      }
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get("origin")}/business-profile?refresh=true`,
      return_url: `${req.headers.get("origin")}/business-profile?setup=complete`,
      type: "account_onboarding",
    });

    console.log(`Stripe Connect onboarding link created for user ${user.id}`);

    return new Response(JSON.stringify({ 
      account_id: accountId,
      onboarding_url: accountLink.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe Connect setup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});