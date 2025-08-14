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
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { sessionId } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Extract metadata
      const { offer_id, user_id, participant_count, promotion_id } = session.metadata;

      // Get offer details
      const { data: offer } = await supabaseClient
        .from('offers')
        .select('business_user_id')
        .eq('id', offer_id)
        .single();

      if (offer) {
        // Create booking
        const { error: bookingError } = await supabaseClient
          .from('bookings')
          .insert({
            user_id,
            offer_id,
            business_user_id: offer.business_user_id,
            participant_count: parseInt(participant_count),
            status: 'confirmed',
            booking_date: new Date().toISOString(),
            notes: promotion_id ? `Réservation via offre flash (Promotion ID: ${promotion_id})` : null
          });

        if (bookingError) {
          console.error('Error creating booking:', bookingError);
          throw bookingError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Paiement confirmé et réservation créée" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      message: "Paiement non confirmé" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});