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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user?.email) {
      throw new Error("User not authenticated");
    }

    const user = data.user;

    // Check if user is a business user
    if (user.user_metadata?.account_type !== "business") {
      throw new Error("Only business users can create Stripe Connect accounts");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if user already has a Connect account
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id, first_name, last_name, email")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error("Failed to fetch user profile");
    }

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