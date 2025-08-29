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
    console.log("🚀 Starting Stripe Connect setup...");

    // Verify required environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔧 Environment variables check:");
    console.log("- Stripe key:", stripeKey ? `✅ Available (${stripeKey.substring(0, 7)}...${stripeKey.substring(stripeKey.length - 4)})` : "❌ Missing");
    console.log("- Supabase URL:", supabaseUrl ? `✅ Available (${supabaseUrl})` : "❌ Missing");
    console.log("- Service key:", supabaseServiceKey ? `✅ Available (${supabaseServiceKey.substring(0, 10)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 4)})` : "❌ Missing");

    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY manquante");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Configuration Stripe manquante",
          details: "Veuillez configurer votre clé secrète Stripe dans les paramètres des Edge Functions"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Configuration Supabase manquante");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Configuration serveur manquante" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    console.log("✅ Toutes les variables d'environnement sont présentes");

    // Authenticate user from Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔐 Header Authorization:", authHeader ? `✅ Token présent (Bearer ${authHeader.substring(7, 15)}...${authHeader.substring(authHeader.length - 8)})` : "❌ Manquant");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Header Authorization manquant ou invalide");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Non autorisé - token manquant" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    // Initialize Supabase with service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and validate user token
    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 Validation du token utilisateur...");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log("👤 Résultat auth.getUser:", {
      success: !!user,
      userId: user?.id || null,
      email: user?.email || null,
      error: userError?.message || null
    });

    if (userError || !user) {
      console.error("❌ Token invalide:", userError?.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Session invalide ou expirée" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }

    console.log("✅ Utilisateur authentifié:", user.id);

    // Initialize Stripe with the latest supported API version
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
      typescript: true 
    });

    // Create or update user profile with upsert
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        email: user.email || null,
        account_type: "business"
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select("id, user_id, stripe_connect_account_id")
      .single();

    if (profileError) {
      console.error("❌ Erreur profil utilisateur:", profileError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Erreur lors de la gestion du profil utilisateur",
          details: profileError.message
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    console.log("✅ Profil utilisateur prêt:", profile.id);

    // Check if Stripe Connect account already exists
    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      console.log("📝 Création d'un nouveau compte Stripe Connect Express...");
      
      try {
        console.log("🔄 Appel Stripe: stripe.accounts.create()");
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          settings: {
            payouts: {
              schedule: {
                interval: "manual"
              }
            }
          }
        });

        console.log("✅ Réponse Stripe: compte créé avec succès", {
          accountId: account.id,
          type: account.type,
          created: account.created
        });

        accountId = account.id;
        console.log("✅ Compte Stripe créé:", accountId);

        // Save Stripe account ID to user profile
        console.log("💾 Sauvegarde de l'account ID dans Supabase...");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_connect_account_id: accountId })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("❌ Erreur sauvegarde account ID:", updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Erreur lors de la sauvegarde du compte Stripe",
              details: updateError.message
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500
            }
          );
        }

        console.log("✅ Account ID sauvegardé dans Supabase");

      } catch (stripeError: any) {
        console.error("❌ Erreur création compte Stripe:", stripeError);
        console.error("- Message:", stripeError.message);
        console.error("- Type:", stripeError.type);
        console.error("- Code:", stripeError.code);
        
        // Handle specific Stripe platform configuration error
        if (stripeError.message?.includes("platform-profile")) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Configuration de plateforme Stripe requise",
              details: "Votre compte Stripe doit être configuré pour accepter les comptes Connect. Consultez https://dashboard.stripe.com/settings/connect/platform-profile",
              action_required: "platform_setup"
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Erreur lors de la création du compte Stripe",
            details: stripeError.message
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }
    } else {
      console.log("✅ Utilisation du compte Stripe existant:", accountId);
    }

    // Generate frontend URLs from request headers
    const origin = req.headers.get("origin") || req.headers.get("referer");
    const baseUrl = origin ? origin.replace(/\/$/, '') : "https://uxdddiaheswxgkoannri.supabase.co";
    
    console.log("🔗 Création du lien d'onboarding avec URL base:", baseUrl);
    
    try {
      // Create Stripe account onboarding link
      console.log("🔄 Appel Stripe: stripe.accountLinks.create()");
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/stripe-connect-setup`,
        return_url: `${baseUrl}/stripe-connect-setup`,
        type: "account_onboarding",
      });

      console.log("✅ Réponse Stripe: lien créé avec succès", {
        url: accountLink.url,
        expires_at: accountLink.expires_at
      });

      console.log("✅ Lien d'onboarding créé:", accountLink.url);

      return new Response(
        JSON.stringify({
          success: true,
          account_id: accountId,
          onboarding_url: accountLink.url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } catch (linkError: any) {
      console.error("❌ Erreur création lien onboarding:", linkError);
      console.error("- Message:", linkError.message);
      console.error("- Type:", linkError.type);
      console.error("- Code:", linkError.code);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Erreur lors de la création du lien d'onboarding",
          details: linkError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

  } catch (error: any) {
    console.error("💥 Erreur inattendue:", error);
    console.error("- Message:", error.message);
    console.error("- Stack trace:", error.stack);
    console.error("- Constructor:", error.constructor?.name);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Une erreur inattendue s'est produite",
        details: error.message || "Erreur inconnue",
        type: error.constructor?.name || "Error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});