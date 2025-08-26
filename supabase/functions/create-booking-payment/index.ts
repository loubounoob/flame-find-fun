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
    console.log("🚀 Creating booking payment...");

    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
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

    // Initialize Supabase with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user with the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    // Get request body
    const { bookingId, amount, description } = await req.json();

    if (!bookingId || !amount) {
      return new Response(
        JSON.stringify({ error: "Données manquantes" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    console.log(`💰 Creating payment for booking ${bookingId}, amount: €${amount/100}`);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        offers (
          title,
          business_user_id,
          profiles (
            stripe_connect_account_id,
            stripe_connect_charges_enabled
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Réservation non trouvée" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404
        }
      );
    }

    const businessProfile = booking.offers.profiles;
    if (!businessProfile?.stripe_connect_account_id || !businessProfile?.stripe_connect_charges_enabled) {
      return new Response(
        JSON.stringify({ error: "L'entreprise n'a pas configuré Stripe Connect" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate fees (5% platform fee)
    const platformFeeAmount = Math.round(amount * 0.05);
    const businessAmount = amount - platformFeeAmount;

    console.log(`💸 Platform fee: €${platformFeeAmount/100}, Business gets: €${businessAmount/100}`);

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "eur",
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: businessProfile.stripe_connect_account_id,
      },
      metadata: {
        booking_id: bookingId,
        business_user_id: booking.offers.business_user_id,
        customer_user_id: user.id,
      },
      description: description || `Paiement pour ${booking.offers.title}`,
    });

    console.log("✅ Payment intent created:", paymentIntent.id);

    // Create transaction record
    await supabase
      .from("stripe_transactions")
      .insert({
        booking_id: bookingId,
        business_user_id: booking.offers.business_user_id,
        customer_user_id: user.id,
        amount: amount,
        business_amount: businessAmount,
        platform_fee: platformFeeAmount,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      });

    console.log("📝 Transaction record created");

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Payment creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de la création du paiement",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});