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

const validateEarningInput = (data: any) => {
  const errors: string[] = [];

  if (typeof data.amount !== 'number' || data.amount <= 0 || data.amount > 100000) {
    errors.push("Amount must be a positive number not exceeding €100,000");
  }
  if (!data.bookingId || !isValidUUID(data.bookingId)) {
    errors.push("Invalid booking ID format");
  }
  if (data.description && typeof data.description !== 'string') {
    errors.push("Description must be a string");
  }
  if (data.description && data.description.length > 500) {
    errors.push("Description must not exceed 500 characters");
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

    // Get user from auth header (anon key for auth)
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
    const { amount, bookingId, description } = requestBody;

    // Validate input
    const validationErrors = validateEarningInput(requestBody);
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
    const { data, error } = await supabaseClient.rpc('secure_add_earning', {
      p_business_user_id: user.id,
      p_amount: amount,
      p_booking_id: bookingId,
      p_description: description
    });

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message);
    }

    console.log(`Earning added successfully for user ${user.id}, amount: ${amount}€`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Add earning error:", errorMessage);
    
    // Return generic error to client, log details server-side
    return new Response(JSON.stringify({ 
      error: 'Failed to add earning. Please try again.' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});