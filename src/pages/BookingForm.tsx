import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TimeSlotSelector } from "@/components/ui/time-slot-selector";

import { Calendar, Users, Clock, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const { toast } = useToast();
  const [participantCount, setParticipantCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [customBookingTime, setCustomBookingTime] = useState("");
  const [customBookingDate, setCustomBookingDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getBookingDateTime = () => {
    // Si c'est un créneau personnalisé
    if (selectedTimeSlot === "custom" && customBookingTime && customBookingDate) {
      return { date: customBookingDate, time: customBookingTime };
    }
    
    // Sinon, extraire de l'ID du slot sélectionné
    if (!selectedTimeSlot) return { date: "", time: "" };
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (selectedTimeSlot.includes("today")) {
      const time = selectedTimeSlot.split("-")[1] + ":00";
      return { date: today, time };
    } else if (selectedTimeSlot.includes("tomorrow")) {
      const time = selectedTimeSlot.split("-")[1] + ":00";
      return { date: tomorrow, time };
    }
    
    return { date: "", time: "" };
  };

  const handleCustomSlot = (time: string, date: string) => {
    setCustomBookingTime(time);
    setCustomBookingDate(date);
    setSelectedTimeSlot("custom");
  };

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

  if (existingBooking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Déjà réservé</h2>
            <p className="text-muted-foreground mb-4">
              Vous avez déjà réservé cette offre.
            </p>
            <Button onClick={() => navigate("/booking")} className="w-full">
              Voir mes réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatePrice = () => {
    if (promotion) {
      return promotion.promotional_price * participantCount;
    }
    if (offer?.base_price) {
      return offer.base_price * participantCount;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;

    setIsSubmitting(true);
    
    try {
      const bookingDateTime = getBookingDateTime();
      
      if (!bookingDateTime.date || !bookingDateTime.time) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une date et une heure",
          variant: "destructive"
        });
        return;
      }

      // Create the booking first
      const booking = await createBooking({
        offerId: offer.id,
        participantCount,
        bookingDate: bookingDateTime.date,
        bookingTime: bookingDateTime.time,
        notes,
        businessUserId: offer.business_user_id,
      });

      if (booking?.id) {
        toast({
          title: "Réservation créée !",
          description: "Votre réservation a été confirmée avec succès.",
        });
        navigate("/booking");
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la réservation",
        variant: "destructive"
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
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {offer.price ? `${offer.price}` : "Prix sur demande"}
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
                <div className="space-y-2">
                  <Label htmlFor="participants" className="flex items-center gap-2">
                    <Users size={16} />
                    Nombre de participants
                  </Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    max={offer.max_participants || 10}
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  {offer.max_participants && (
                    <p className="text-xs text-muted-foreground">
                      Maximum {offer.max_participants} participants
                    </p>
                  )}
                </div>

                <TimeSlotSelector
                  selectedSlot={selectedTimeSlot}
                  onSlotSelect={setSelectedTimeSlot}
                  onCustomSlot={handleCustomSlot}
                />

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
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participants:</span>
                      <span className="font-medium">{participantCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix unitaire:</span>
                      <span className="font-medium">
                        {promotion ? `${promotion.promotional_price}€` : (offer.base_price ? `${offer.base_price}€` : "À discuter")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-lg text-primary">
                        {calculatePrice() > 0 ? `${calculatePrice()}€` : "À discuter"}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isSubmitting || !selectedTimeSlot}
                  >
                    {isSubmitting ? "Création de la réservation..." : "Créer la réservation"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

      </div>
    </div>
  );
}