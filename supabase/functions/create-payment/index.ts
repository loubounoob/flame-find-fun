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
    // Create Supabase client
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

    // Parse and validate request body
    const body = await req.json();
    const { offerId, promotionId, amount, participantCount, bookingDate, bookingTime, notes, selectedPricingOptionId } = body;

    // Validate required fields
    if (!offerId || !amount || !participantCount || !bookingDate) {
      throw new Error("Missing required fields");
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Validate participant count
    if (participantCount <= 0) {
      throw new Error("Invalid participant count");
    }

    // Verify offer exists and get business details
    const { data: offer, error: offerError } = await supabaseClient
      .from("offers")
      .select("id, business_user_id, title, base_price")
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      throw new Error("Offer not found");
    }

    // Get business profile with Stripe Connect info
    const { data: businessProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_charges_enabled, first_name, last_name")
      .eq("user_id", offer.business_user_id)
      .single();

    if (profileError || !businessProfile) {
      throw new Error("Business profile not found");
    }

    if (!businessProfile.stripe_connect_account_id || !businessProfile.stripe_connect_charges_enabled) {
      throw new Error("Business has not completed Stripe Connect setup");
    }

    // Get pricing option details if provided
    let pricingOption = null;
    if (selectedPricingOptionId) {
      const { data: pricing, error: pricingError } = await supabaseClient
        .from("business_pricing")
        .select("*")
        .eq("id", selectedPricingOptionId)
        .eq("business_user_id", offer.business_user_id)
        .eq("is_active", true)
        .single();

      if (!pricingError && pricing) {
        pricingOption = pricing;
      }
    }

    // If promotion is specified, verify it's valid
    if (promotionId) {
      const { data: promotion, error: promoError } = await supabaseClient
        .from("promotions")
        .select("*")
        .eq("id", promotionId)
        .eq("offer_id", offerId)
        .eq("is_active", true)
        .single();

      if (promoError || !promotion) {
        throw new Error("Invalid promotion");
      }

      // Check if promotion is within valid date range
      const now = new Date();
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(promotion.end_date);
      
      if (now < startDate || now > endDate) {
        throw new Error("Promotion is not active");
      }
    }

    // Calculate platform fee (5% of transaction)
    const platformFeePercent = 0.05;
    const platformFee = Math.round(amount * platformFeePercent);
    const businessAmount = amount - platformFee;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create payment intent with destination charge for Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "eur",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: businessProfile.stripe_connect_account_id,
      },
      metadata: {
        offerId,
        promotionId: promotionId || "",
        userId: user.id,
        participantCount: participantCount.toString(),
        bookingDate,
        bookingTime: bookingTime || "",
        notes: notes || "",
        businessUserId: offer.business_user_id,
        selectedPricingOptionId: selectedPricingOptionId || "",
        pricingOptionName: pricingOption?.service_name || "",
      },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation: ${offer.title}`,
              description: `${participantCount} participant(s) • ${bookingDate} à ${bookingTime}${pricingOption ? ` • ${pricingOption.service_name}` : ""}`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: businessProfile.stripe_connect_account_id,
        },
        metadata: {
          offerId,
          userId: user.id,
          participantCount: participantCount.toString(),
          businessUserId: offer.business_user_id,
        }
      },
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/booking/${offerId}`,
      metadata: {
        offerId,
        promotionId: promotionId || "",
        userId: user.id,
        participantCount: participantCount.toString(),
        bookingDate,
        bookingTime: bookingTime || "",
        notes: notes || "",
        businessUserId: offer.business_user_id,
        selectedPricingOptionId: selectedPricingOptionId || "",
        businessName: `${businessProfile.first_name} ${businessProfile.last_name}`,
      },
    });

    console.log(`Payment session created for user ${user.id}, offer ${offerId}, amount ${amount}, business gets ${businessAmount}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});