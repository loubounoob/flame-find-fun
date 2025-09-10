import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TimeSlotSelector } from "@/components/ui/time-slot-selector";
import { ActivityBookingManager } from "@/components/booking/ActivityBookingManager";
import { SimpleRealtimePriceDisplay } from "@/components/SimpleRealtimePriceDisplay";

import { ArrowLeft } from "lucide-react";
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
  const [notes, setNotes] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [customBookingTime, setCustomBookingTime] = useState("");
  const [customBookingDate, setCustomBookingDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    participants: 1,
    units: 1,
    unitType: 'participant',
    extras: []
  });

  const handleBookingDataChange = (data: any) => {
    setBookingData(data);
  };

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
    // Now handled by DynamicPriceCalculator
    return 0;
  };

  const [priceData, setPriceData] = useState<any>(null);

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

      if (!priceData || !priceData.finalPrice || priceData.finalPrice <= 0) {
        toast({
          title: "Erreur",
          description: "Impossible de calculer le prix de la réservation",
          variant: "destructive"
        });
        return;
      }

        // Create the booking first with pending_payment status
        const booking = await createBooking({
          offerId: offer.id,
          participantCount: bookingData.participants,
          bookingDate: bookingDateTime.date,
          bookingTime: bookingDateTime.time,
          notes,
          businessUserId: offer.business_user_id
        });

      if (booking?.id) {
        // Create Stripe payment session
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
          body: {
            bookingId: booking.id,
            offerId: offer.id,
            businessUserId: offer.business_user_id,
            amount: priceData.finalPrice,
            participantCount: bookingData.participants,
            bookingDate: bookingDateTime.date,
            bookingTime: bookingDateTime.time,
            description: `Réservation ${offer.title} - ${bookingData.participants} personne(s)`
          }
        });

        if (paymentError) {
          console.error('Payment error:', paymentError);
          toast({
            title: "Erreur de paiement",
            description: "Impossible de créer la session de paiement",
            variant: "destructive"
          });
          return;
        }

        if (paymentData?.url) {
          // Redirect to Stripe Checkout
          window.location.href = paymentData.url;
        } else {
          throw new Error("URL de paiement non reçue");
        }
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
                {/* Activity-specific booking form */}
                <ActivityBookingManager
                  category={offer.category}
                  maxParticipants={offer.max_participants}
                  onBookingDataChange={handleBookingDataChange}
                />

                 <TimeSlotSelector
                  selectedSlot={selectedTimeSlot}
                  onSlotSelect={setSelectedTimeSlot}
                  onCustomSlot={handleCustomSlot}
                />

                 {/* Real-time Price Display */}
                 <SimpleRealtimePriceDisplay
                   offerId={id!}
                   businessUserId={offer.business_user_id}
                   participantCount={bookingData.participants}
                   unitsCount={bookingData.units}
                   unitType={bookingData.unitType}
                   showBreakdown={true}
                   onPriceChange={setPriceData}
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
                   <Button 
                     type="submit" 
                     className="w-full bg-gradient-primary hover:opacity-90"
                     disabled={isSubmitting || !selectedTimeSlot || !priceData?.finalPrice}
                   >
                     {isSubmitting ? "Redirection vers le paiement..." : `Payer ${priceData?.finalPrice ? `${priceData.finalPrice}€` : ''} et réserver`}
                   </Button>
                 </div>
              </form>
            </CardContent>
          </Card>

      </div>
    </div>
  );
}