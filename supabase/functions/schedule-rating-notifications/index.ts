import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Rechercher les réservations terminées depuis 3h qui n'ont pas encore de notification d'évaluation
    const { data: completedBookings, error } = await supabaseClient
      .from("bookings")
      .select(`
        id,
        user_id,
        offer_id,
        booking_date,
        booking_time,
        metadata
      `)
      .eq("status", "confirmed")
      .not("booking_date", "is", null)
      .not("booking_time", "is", null);

    if (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      throw error;
    }

    let notificationsCreated = 0;

    for (const booking of completedBookings || []) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const now = new Date();
      const threeHoursAfter = new Date(bookingDateTime.getTime() + 3 * 60 * 60 * 1000);

      // Vérifier si 3h se sont écoulées depuis la réservation
      if (now >= threeHoursAfter) {
        // Vérifier si une notification d'évaluation n'a pas déjà été envoyée
        const metadata = booking.metadata as any || {};
        if (!metadata.rating_notification_sent) {
          // Créer la notification d'évaluation
          const { error: notificationError } = await supabaseClient
            .rpc("schedule_rating_notification", {
              booking_id: booking.id,
              user_id: booking.user_id,
              offer_id: booking.offer_id
            });

          if (!notificationError) {
            // Marquer que la notification a été envoyée
            await supabaseClient
              .from("bookings")
              .update({
                metadata: { ...metadata, rating_notification_sent: true }
              })
              .eq("id", booking.id);

            notificationsCreated++;
            console.log(`Notification d'évaluation créée pour la réservation ${booking.id}`);
          } else {
            console.error(`Erreur lors de la création de la notification pour ${booking.id}:`, notificationError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${notificationsCreated} notifications d'évaluation créées`,
        processed: completedBookings?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Erreur dans la fonction de notification d'évaluation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});