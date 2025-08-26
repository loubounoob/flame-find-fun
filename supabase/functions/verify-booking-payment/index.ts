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
    console.log("🔍 Verifying payment...");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuration manquante" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Payment intent ID manquant" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log(`💳 Payment status: ${paymentIntent.status}`);

    // Update transaction status
    const { error: updateError } = await supabase
      .from("stripe_transactions")
      .update({ 
        status: paymentIntent.status === "succeeded" ? "completed" : "failed"
      })
      .eq("stripe_payment_intent_id", paymentIntentId);

    if (updateError) {
      console.error("❌ Error updating transaction:", updateError);
    }

    // If payment succeeded, add earnings to business
    if (paymentIntent.status === "succeeded") {
      const { data: transaction } = await supabase
        .from("stripe_transactions")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (transaction) {
        // Add earning using the secure function
        await supabase.rpc("secure_add_earning", {
          p_business_user_id: transaction.business_user_id,
          p_amount: transaction.business_amount / 100, // Convert cents to euros
          p_booking_id: transaction.booking_id,
          p_description: `Paiement reçu - Réservation #${transaction.booking_id.slice(0, 8)}`
        });

        console.log(`✅ Added €${transaction.business_amount/100} to business earnings`);
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentIntent.status,
        paid: paymentIntent.status === "succeeded",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Payment verification error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de la vérification du paiement",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});