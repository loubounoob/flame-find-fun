import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if this is a promotion booking
  const { data: promotion } = useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("offer_id", id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      if (!id) throw new Error("No offer ID");
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingBooking } = useQuery({
    queryKey: ["existingBooking", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .eq("offer_id", id)
        .eq("is_archived", false)
        .eq("status", "confirmed")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  if (!user) {
    // Redirect to auth page instead of showing message
    navigate("/auth");
    return null;
  }

  if (isLoading || !offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !offer) {
      toast({
        title: "Erreur",
        description: "Informations manquantes pour effectuer la réservation",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          offer_id: offer.id,
          business_user_id: offer.business_user_id,
          participant_count: participantCount,
          notes: notes || null,
          status: 'confirmed'
        });

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      toast({
        title: "Réservation confirmée !",
        description: "Votre réservation a été créée avec succès. L'entreprise va vous contacter prochainement.",
      });

      navigate('/booking');
    } catch (error) {
      console.error('Error in booking submission:', error);
      toast({
        title: "Erreur lors de la réservation",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-poppins font-bold text-gradient-primary">
            Réserver
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Offer Summary */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gradient-primary rounded-lg flex-shrink-0 bg-cover bg-center"
                   style={{ backgroundImage: offer.image_url ? `url(${offer.image_url})` : undefined }}>
              </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-foreground">{offer.title}</h3>
                 <p className="text-sm text-muted-foreground">{offer.category}</p>
                 <div className="flex gap-2 mt-1">
                   <Badge variant="secondary" className="text-xs">
                     {offer.category}
                   </Badge>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Détails de la réservation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Participant Count */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nombre de participants
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                      disabled={participantCount <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{participantCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCount(participantCount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    Notes ou demandes spéciales
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Ajoutez des notes pour votre réservation (optionnel)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                 <div className="pt-4 border-t border-border/50">
                   <Button 
                     type="submit" 
                     className="w-full bg-gradient-primary hover:opacity-90"
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? "Réservation en cours..." : "Confirmer la réservation"}
                   </Button>
                 </div>
              </form>
            </CardContent>
          </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">📞 Prochaines étapes</h3>
              <p className="text-sm text-blue-800">
                Après votre réservation, l'entreprise vous contactera directement pour :
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Confirmer les détails (date, heure, prix)</li>
                <li>Organiser le paiement</li>
                <li>Vous donner toutes les informations pratiques</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}