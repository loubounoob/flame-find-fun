import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients with service role for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse request body
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      throw new Error("Session ID required");
    }

    console.log(`Verifying payment for session: ${sessionId}`);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const metadata = session.metadata;
      
      if (!metadata) {
        throw new Error("Missing session metadata");
      }

      // Validate metadata
      if (!metadata.offerId || !metadata.userId || !metadata.businessUserId) {
        throw new Error("Invalid session metadata");
      }

      // Verify the offer still exists
      const { data: offer, error: offerError } = await supabaseClient
        .from("offers")
        .select("id, business_user_id, title")
        .eq("id", metadata.offerId)
        .single();

      if (offerError || !offer) {
        throw new Error("Offer not found");
      }

      // Verify business user matches
      if (offer.business_user_id !== metadata.businessUserId) {
        throw new Error("Business user mismatch");
      }

      // Check if booking already exists to prevent duplicates
      const { data: existingBooking } = await supabaseClient
        .from("bookings")
        .select("id")
        .eq("user_id", metadata.userId)
        .eq("offer_id", metadata.offerId)
        .eq("booking_date", metadata.bookingDate)
        .maybeSingle();

      if (existingBooking) {
        console.log(`Booking already exists for user ${metadata.userId}, offer ${metadata.offerId}`);
        return new Response(JSON.stringify({ success: true, bookingId: existingBooking.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create booking atomically
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .insert({
          user_id: metadata.userId,
          offer_id: metadata.offerId,
          business_user_id: metadata.businessUserId,
          participant_count: parseInt(metadata.participantCount),
          booking_date: metadata.bookingDate,
          booking_time: metadata.bookingTime || null,
          notes: metadata.notes || null,
          status: "confirmed",
        })
        .select("id")
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      // Add earnings to business using secure function
      const bookingAmount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
      
      try {
        const { error: earningError } = await supabaseClient.rpc('secure_add_earning', {
          p_business_user_id: metadata.businessUserId,
          p_amount: bookingAmount,
          p_booking_id: booking.id,
          p_description: `Réservation confirmée - ${offer.title}`
        });

        if (earningError) {
          console.error("Error adding earnings:", earningError);
          // Don't fail the whole transaction for earning recording issues
        }
      } catch (earningErr) {
        console.error("Failed to record earnings:", earningErr);
        // Continue with successful booking
      }

      console.log(`Payment verified and booking created: ${booking.id}`);

      return new Response(JSON.stringify({ 
        success: true, 
        bookingId: booking.id,
        amount: bookingAmount 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Payment not completed for session: ${sessionId}, status: ${session.payment_status}`);

    return new Response(JSON.stringify({ 
      success: false, 
      status: session.payment_status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});