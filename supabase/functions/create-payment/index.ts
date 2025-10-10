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
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

// Input validation helpers
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validatePaymentInput = (data: any) => {
  const errors: string[] = [];

  if (!data.bookingId || !isValidUUID(data.bookingId)) {
    errors.push("Invalid booking ID format");
  }
  if (!data.offerId || !isValidUUID(data.offerId)) {
    errors.push("Invalid offer ID format");
  }
  if (!data.businessUserId || !isValidUUID(data.businessUserId)) {
    errors.push("Invalid business user ID format");
  }
  if (typeof data.amount !== 'number' || data.amount <= 0 || data.amount > 100000) {
    errors.push("Amount must be between €0.01 and €100,000");
  }
  if (typeof data.participantCount !== 'number' || data.participantCount < 1 || data.participantCount > 1000) {
    errors.push("Participant count must be between 1 and 1000");
  }
  if (data.description && (typeof data.description !== 'string' || data.description.length > 500)) {
    errors.push("Description must be a string not exceeding 500 characters");
  }

  return errors;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for database operations
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate request body
    const requestBody = await req.json();
    const { 
      bookingId, 
      offerId, 
      businessUserId, 
      amount, 
      participantCount, 
      bookingDate, 
      bookingTime, 
      description 
    } = requestBody;

    logStep("Request data received", { 
      bookingId, 
      offerId, 
      businessUserId, 
      amount, 
      participantCount 
    });

    // Validate input
    const validationErrors = validatePaymentInput(requestBody);
    if (validationErrors.length > 0) {
      logStep("Validation errors", validationErrors);
      return new Response(JSON.stringify({ 
        error: 'Invalid input parameters',
        details: validationErrors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Get offer details for the payment description
    const { data: offer } = await supabaseService
      .from('offers')
      .select('title, category')
      .eq('id', offerId)
      .single();

    const productName = offer ? `${offer.title} - ${offer.category}` : 'Réservation';
    
    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: productName,
              description: description || `Réservation pour ${participantCount} personne(s)`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.get("origin")}/booking-form/${offerId}`,
      metadata: {
        booking_id: bookingId,
        offer_id: offerId,
        business_user_id: businessUserId,
        user_id: user.id,
        participant_count: participantCount.toString(),
        booking_date: bookingDate,
        booking_time: bookingTime
      }
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Update booking with payment session ID and set status to pending_payment
    const { error: updateError } = await supabaseService
      .from('bookings')
      .update({ 
        status: 'pending_payment',
        stripe_session_id: session.id 
      })
      .eq('id', bookingId);

    if (updateError) {
      logStep("ERROR updating booking", updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    logStep("Booking updated with session ID");

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    
    // Return generic error to client, log details server-side
    return new Response(JSON.stringify({ 
      error: 'Payment creation failed. Please try again.' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});