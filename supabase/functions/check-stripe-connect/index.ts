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
    console.log("🔍 Checking Stripe Connect status...");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("- Stripe key:", stripeKey ? "✅ Available" : "❌ Missing");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not available");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const { accountId } = await req.json();

    console.log(`🔍 Checking account: ${accountId}`);

    if (!accountId) {
      throw new Error("Account ID required");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get account status
    const account = await stripe.accounts.retrieve(accountId);

    console.log(`📊 Account status: charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}`);

    // Update profile with current status
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      
      if (data.user) {
        const { error } = await supabaseClient
          .from("profiles")
          .update({
            stripe_connect_onboarding_completed: account.details_submitted,
            stripe_connect_charges_enabled: account.charges_enabled,
            stripe_connect_payouts_enabled: account.payouts_enabled
          })
          .eq("user_id", data.user.id);

        if (error) {
          console.error("❌ Error updating profile:", error);
        } else {
          console.log("✅ Profile updated successfully");
        }
      }
    }

    return new Response(JSON.stringify({
      account_id: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe Connect status check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});