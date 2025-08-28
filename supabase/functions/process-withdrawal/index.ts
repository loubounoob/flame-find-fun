import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("💸 Processing withdrawal request...");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing environment configuration");
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Parse request body
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    console.log("💰 Processing withdrawal for user:", user.id, "Amount:", amount);

    // Initialize service client
    const supabaseService = createClient(supabaseUrl, serviceKey);

    // Check available balance
    const { data: earnings, error: earningsError } = await supabaseService
      .from("business_earnings")
      .select("amount")
      .eq("business_user_id", user.id)
      .eq("status", "completed");

    if (earningsError) {
      throw new Error("Failed to check earnings");
    }

    const totalEarnings = earnings?.reduce((sum, earning) => sum + parseFloat(earning.amount), 0) || 0;

    // Check existing withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabaseService
      .from("withdrawal_requests")
      .select("amount")
      .eq("business_user_id", user.id)
      .in("status", ["pending", "completed"]);

    if (withdrawalsError) {
      throw new Error("Failed to check withdrawals");
    }

    const totalWithdrawn = withdrawals?.reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount), 0) || 0;
    const availableBalance = totalEarnings - totalWithdrawn;

    console.log("💳 Balance check:", {
      totalEarnings,
      totalWithdrawn,
      availableBalance,
      requestedAmount: amount
    });

    if (amount > availableBalance) {
      throw new Error("Insufficient balance for withdrawal");
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseService
      .from("withdrawal_requests")
      .insert({
        business_user_id: user.id,
        amount: amount,
        status: "pending"
      })
      .select()
      .single();

    if (withdrawalError) {
      throw new Error("Failed to create withdrawal request");
    }

    console.log("✅ Withdrawal request created:", withdrawal.id);

    // In a real implementation, you would process the withdrawal here
    // For now, we'll mark it as completed immediately
    const { error: completeError } = await supabaseService
      .from("withdrawal_requests")
      .update({ 
        status: "completed",
        processed_at: new Date().toISOString()
      })
      .eq("id", withdrawal.id);

    if (completeError) {
      console.error("Failed to complete withdrawal:", completeError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        withdrawalId: withdrawal.id,
        message: "Withdrawal request processed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Withdrawal error:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});