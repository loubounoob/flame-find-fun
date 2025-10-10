import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const VALID_BOOST_TYPES = ['visibility', 'featured', 'premium'];

const validateBoostInput = (data: any) => {
  const errors: string[] = [];

  if (!data.offerId || !isValidUUID(data.offerId)) {
    errors.push("Invalid offer ID format");
  }
  if (!data.boostType || !VALID_BOOST_TYPES.includes(data.boostType)) {
    errors.push(`Boost type must be one of: ${VALID_BOOST_TYPES.join(', ')}`);
  }
  if (typeof data.amount !== 'number' || data.amount <= 0 || data.amount > 10000) {
    errors.push("Amount must be a positive number not exceeding €10,000");
  }
  if (typeof data.duration !== 'number' || data.duration < 1 || data.duration > 365) {
    errors.push("Duration must be between 1 and 365 days");
  }

  return errors;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData } = await anonClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const requestBody = await req.json();
    const { offerId, boostType, amount, duration } = requestBody;

    console.log('Boost payment request received');

    // Validate input
    const validationErrors = validateBoostInput(requestBody);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return new Response(JSON.stringify({ 
        error: 'Invalid input parameters',
        details: validationErrors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call secure database function
    const { data, error } = await supabaseClient.rpc('secure_pay_for_boost', {
      p_business_user_id: user.id,
      p_offer_id: offerId,
      p_boost_type: boostType,
      p_amount: amount,
      p_duration: duration
    });

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message);
    }

    console.log(`Boost payment processed for user ${user.id}, offer: ${offerId}, amount: ${amount}€`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Boost payment error:", errorMessage);
    
    // Return generic error to client, log details server-side
    return new Response(JSON.stringify({ 
      error: 'Boost payment failed. Please try again.' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});