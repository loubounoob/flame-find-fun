import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TimeSlotSelector } from "@/components/ui/time-slot-selector";
import { ActivityBookingManager } from "@/components/booking/ActivityBookingManager";
import { 
  ArrowLeft, 
  ArrowRight,
  Check, 
  ShoppingCart,
  Calendar,
  Users,
  Clock,
  Euro
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, title: "Service", description: "Votre sélection" },
  { id: 2, title: "Configuration", description: "Participants & options" },
  { id: 3, title: "Finalisation", description: "Date & paiement" }
];

export default function ShopifyBookingInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [customBookingTime, setCustomBookingTime] = useState("");
  const [customBookingDate, setCustomBookingDate] = useState("");
  
  const [bookingData, setBookingData] = useState({
    participants: 1,
    units: 1,
    unitType: 'participant',
    extras: []
  });

  // Récupérer les données depuis la navigation
  const { selectedService, offer, businessProfile } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!selectedService || !offer) {
      navigate(`/offer/${id}`);
      return;
    }
  }, [user, selectedService, offer, navigate, id]);

  const calculateTotalPrice = () => {
    if (!selectedService) return 0;
    
    let basePrice = selectedService.price_amount;
    let multiplier = 1;

    // Calculate multiplier based on service type
    if (selectedService.price_type === 'par participant') {
      multiplier = bookingData.participants;
    } else if (selectedService.price_type === 'par heure') {
      multiplier = bookingData.units;
    } else if (selectedService.price_type === 'par partie') {
      multiplier = bookingData.units;
    }

    return basePrice * multiplier;
  };

  const getBookingDateTime = () => {
    if (selectedTimeSlot === "custom" && customBookingTime && customBookingDate) {
      return { date: customBookingDate, time: customBookingTime };
    }
    
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

  const handleBookingDataChange = (data: any) => {
    setBookingData(data);
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!offer || !selectedService) return;

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

      const booking = await createBooking({
        offerId: offer.id,
        participantCount: bookingData.participants,
        bookingDate: bookingDateTime.date,
        bookingTime: bookingDateTime.time,
        notes,
        businessUserId: offer.business_user_id
      });

      if (booking?.id) {
        toast({
          title: "Réservation confirmée !",
          description: `Votre réservation de ${selectedService.service_name} a été confirmée.`,
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

  if (!selectedService || !offer) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Chargement...</div>
    </div>;
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Service already selected
      case 2: return bookingData.participants > 0;
      case 3: return selectedTimeSlot !== "";
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-poppins font-bold text-gradient-primary">
              Réservation
            </h1>
            <p className="text-sm text-muted-foreground">
              {businessProfile?.business_name || `${businessProfile?.first_name} ${businessProfile?.last_name}`}
            </p>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-background/50 border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= step.id 
                  ? 'bg-gradient-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-2 rounded ${
                  currentStep > step.id ? 'bg-gradient-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <h2 className="font-semibold text-foreground">{STEPS[currentStep - 1].title}</h2>
          <p className="text-xs text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Step 1: Service Summary */}
        {currentStep === 1 && (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart size={20} className="text-primary" />
                <h3 className="text-xl font-bold text-foreground">Service sélectionné</h3>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground mb-2">{selectedService.service_name}</h4>
                    {selectedService.description && (
                      <p className="text-sm text-muted-foreground mb-2">{selectedService.description}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {selectedService.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {selectedService.duration_minutes}min
                        </span>
                      )}
                      {selectedService.max_participants && (
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          Max {selectedService.max_participants} pers.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-2xl font-bold text-primary">{selectedService.price_amount}€</span>
                    <p className="text-xs text-muted-foreground">{selectedService.price_type}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ✓ Service confirmé - Configurez maintenant vos préférences
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-secondary" />
                Configuration de votre réservation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityBookingManager
                category={offer.category}
                maxParticipants={selectedService.max_participants || offer.max_participants}
                onBookingDataChange={handleBookingDataChange}
              />

              {/* Real-time Price Preview */}
              <div className="mt-6 p-4 bg-gradient-primary/10 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-foreground">Prix estimé</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.price_amount}€ × {bookingData.participants > 1 && selectedService.price_type === 'par participant' ? bookingData.participants : bookingData.units}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary">{calculateTotalPrice()}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date & Time Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} className="text-info" />
                  Date et heure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSlotSelector
                  selectedSlot={selectedTimeSlot}
                  onSlotSelect={setSelectedTimeSlot}
                  onCustomSlot={handleCustomSlot}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes ou demandes spéciales (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des informations complémentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Final Summary */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <h3 className="font-bold text-foreground mb-4">Récapitulatif de votre réservation</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{selectedService.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-medium">{bookingData.participants} personne(s)</span>
                  </div>
                  {bookingData.units > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selectedService.price_type === 'par heure' ? 'Durée:' : 'Quantité:'}
                      </span>
                      <span className="font-medium">
                        {bookingData.units} {selectedService.price_type === 'par heure' ? 'heure(s)' : 'unité(s)'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & heure:</span>
                    <span className="font-medium">
                      {selectedTimeSlot === "custom" 
                        ? `${customBookingDate} à ${customBookingTime}`
                        : selectedTimeSlot.replace('today', 'Aujourd\'hui').replace('tomorrow', 'Demain')
                      }
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-3 flex justify-between">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">{calculateTotalPrice()}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              className="flex-1"
            >
              <ArrowLeft size={16} className="mr-2" />
              Précédent
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button 
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Suivant
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 bg-gradient-primary hover:opacity-90 text-lg py-6"
            >
              {isSubmitting ? "Confirmation..." : `Confirmer la réservation - ${calculateTotalPrice()}€`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}