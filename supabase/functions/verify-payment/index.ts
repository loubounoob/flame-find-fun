import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // 1. Authentication check - verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create client with user's JWT token for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: {
          headers: { authorization: authHeader }
        }
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }

    logStep("User authenticated", { userId: user.id });

    // Service role client for database operations (only after auth check)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { sessionId, bookingId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Request data received", { sessionId, bookingId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      sessionId, 
      paymentStatus: session.payment_status,
      status: session.status 
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        success: false, 
        status: session.payment_status,
        message: 'Payment not completed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get booking details
    const actualBookingId = bookingId || session.metadata?.booking_id;
    if (!actualBookingId) {
      throw new Error("Booking ID not found");
    }

    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select('*')
      .eq('id', actualBookingId)
      .single();

    if (bookingError) {
      logStep("ERROR fetching booking", bookingError);
      throw new Error("Failed to fetch booking");
    }

    // 2. Authorization check - verify the booking belongs to the authenticated user
    if (booking.user_id !== user.id) {
      logStep("ERROR: User does not own this booking", { 
        bookingUserId: booking.user_id, 
        authenticatedUserId: user.id 
      });
      throw new Error("Unauthorized: You do not own this booking");
    }

    logStep("Booking retrieved and authorized", { bookingId: actualBookingId, currentStatus: booking.status });

    // If already processed, return success
    if (booking.status === 'confirmed' && booking.payment_confirmed) {
      logStep("Payment already processed");
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'already_processed',
        booking: booking 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update booking status to confirmed and mark payment as confirmed
    const { error: updateBookingError } = await supabaseService
      .from('bookings')
      .update({ 
        status: 'confirmed',
        payment_confirmed: true,
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', actualBookingId);

    if (updateBookingError) {
      logStep("ERROR updating booking", updateBookingError);
      throw new Error(`Failed to update booking: ${updateBookingError.message}`);
    }

    logStep("Booking confirmed");

    // Add earning to business finances
    const amount = session.amount_total ? session.amount_total / 100 : booking.total_price || 0;
    
    try {
      // Call the secure_add_earning function
      const { data: earningResult, error: earningError } = await supabaseService
        .rpc('secure_add_earning', {
          p_business_user_id: booking.business_user_id,
          p_amount: amount,
          p_booking_id: actualBookingId,
          p_description: `Paiement réservation - ${booking.participant_count} personne(s)`
        });

      if (earningError) {
        logStep("ERROR adding earning", earningError);
        // Don't throw here, just log the error as the booking is already confirmed
        console.error('Failed to add earning:', earningError);
      } else {
        logStep("Earning added successfully", { amount });
      }
    } catch (earningError) {
      logStep("ERROR in earning process", earningError);
      console.error('Earning process failed:', earningError);
    }

    // Update revenue stats
    try {
      // Trigger revenue stats update
      const { error: statsError } = await supabaseService
        .from('business_revenue_stats')
        .upsert({
          business_user_id: booking.business_user_id,
          stat_date: new Date().toISOString().split('T')[0],
          daily_revenue: 0, // Will be calculated by trigger
          booking_count: 0,  // Will be calculated by trigger
          average_booking_value: 0, // Will be calculated by trigger
        }, {
          onConflict: 'business_user_id,stat_date'
        });

      if (!statsError) {
        logStep("Revenue stats updated");
      }
    } catch (statsError) {
      logStep("Revenue stats update failed", statsError);
    }

    logStep("Payment verification completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      status: 'confirmed',
      booking: booking,
      amount: amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    
    // Return generic error message to client, log details server-side
    const isAuthError = errorMessage.includes("Unauthorized") || errorMessage.includes("authorization");
    const status = isAuthError ? 401 : 500;
    const clientMessage = isAuthError ? errorMessage : "Payment verification failed";
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: clientMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status,
    });
  }
});