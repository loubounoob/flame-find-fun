import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_CUSTOM_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    let subject = "";
    let html = "";
    
    // Customize email based on action type
    switch (email_action_type) {
      case "signup":
        subject = "Confirmez votre inscription sur Ludigo";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Bienvenue sur Ludigo !</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Confirmez votre inscription</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Salut ! Merci de rejoindre Ludigo, la plateforme qui connecte les étudiants aux meilleures offres de loisirs.
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                Pour activer votre compte et commencer à découvrir des expériences incroyables, cliquez sur le bouton ci-dessous :
              </p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                   style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Confirmer mon inscription
                </a>
              </div>
              <p style="color: #999; font-size: 14px; line-height: 1.5;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <span style="color: #ff6b35; word-break: break-all;">
                  ${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
                </span>
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2024 Ludigo - Votre compagnon pour les loisirs étudiants
              </p>
            </div>
          </div>
        `;
        break;
        
      case "recovery":
        subject = "Réinitialisez votre mot de passe Ludigo";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Réinitialisation du mot de passe</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Nouveau mot de passe demandé</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Vous avez demandé la réinitialisation de votre mot de passe Ludigo.
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                   style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Réinitialiser le mot de passe
                </a>
              </div>
              <p style="color: #999; font-size: 14px; line-height: 1.5;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2024 Ludigo - Votre compagnon pour les loisirs étudiants
              </p>
            </div>
          </div>
        `;
        break;
        
      default:
        subject = "Action requise sur votre compte Ludigo";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Ludigo</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                Une action est requise sur votre compte Ludigo. Cliquez sur le lien ci-dessous :
              </p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                   style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Continuer
                </a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2024 Ludigo - Votre compagnon pour les loisirs étudiants
              </p>
            </div>
          </div>
        `;
    }

    const { error } = await resend.emails.send({
      from: 'Ludigo <noreply@loubounoob33.resend.dev>',
      to: [user.email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-custom-email function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});