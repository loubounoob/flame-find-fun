import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ArrowLeft, Users, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [notes, setNotes] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDate, setBookingDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offer || !user) return;
    
    if (!bookingTime) {
      toast({
        title: "Heure requise",
        description: "Veuillez sélectionner une heure pour votre réservation.",
        variant: "destructive"
      });
      return;
    }

    if (!bookingDate) {
      toast({
        title: "Date requise",
        description: "Veuillez sélectionner une date pour votre réservation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = bookingTime.split(':');
      const finalBookingDate = new Date(bookingDate);
      finalBookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const timeNote = `Date: ${format(bookingDate, 'dd/MM/yyyy')} - Heure: ${bookingTime}${notes ? ` - ${notes}` : ''}`;

      const { error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          offer_id: offer.id,
          business_user_id: offer.business_user_id,
          booking_date: finalBookingDate.toISOString(),
          participant_count: participantCount,
          notes: timeNote,
          status: "confirmed"
        });

      if (error) throw error;

      toast({
        title: "Réservation confirmée !",
        description: "Votre réservation a été enregistrée avec succès.",
      });

      navigate("/booking");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <Link to={`/offer/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-lg font-poppins font-bold text-gradient-primary">
            Réserver
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img 
                src={offer.image_url || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"} 
                alt={offer.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="font-poppins font-bold text-foreground text-lg mb-1">
                  {offer.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {offer.category}
                </p>
                <p className="text-sm text-foreground">
                  {offer.location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Détails de la réservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="participants" className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Nombre de personnes
                </Label>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                    disabled={participantCount <= 1}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">
                    {participantCount}
                  </span>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => setParticipantCount(participantCount + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Date souhaitée
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border/50",
                        !bookingDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "dd/MM/yyyy") : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  Heure souhaitée
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="bg-background border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des informations supplémentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background border-border/50 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 h-12 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Réservation en cours..." : "Confirmer la réservation"}
          </Button>
        </form>
      </div>
    </div>
  );
}