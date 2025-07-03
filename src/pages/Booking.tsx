import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CreditCard,
  Check,
  Star
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const mockOffer = {
  id: "1",
  title: "Bowling Party 🎳",
  business: "Strike Zone",
  location: "15 Rue de la République, Lyon",
  timeSlot: "16h00 - 18h00",
  date: "Aujourd'hui",
  discount: "Une partie gratuite",
  image: "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=400&h=300&fit=crop",
  originalPrice: 25,
  discountedPrice: 20,
  rating: 4.8
};

export default function Booking() {
  const { id } = useParams();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation

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
  const [formData, setFormData] = useState({
    participants: 4,
    specialRequests: "",
    name: "Alex Dubois",
    email: "alex.dubois@etudiant.univ-lyon1.fr",
    phone: "06 12 34 56 78"
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleSubmit = () => {
    // Simulate booking process
    setTimeout(() => {
      setBookingSuccess(true);
      setStep(3);
    }, 1500);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-poppins font-bold text-foreground mb-2">
              Réservation confirmée ! 🎉
            </h2>
            <p className="text-muted-foreground mb-6">
              Votre réservation pour "{offer?.title || 'cette offre'}" a été confirmée. Vous recevrez un email de confirmation.
            </p>
            <div className="space-y-3">
              <Link to="/">
                <Button className="w-full bg-gradient-primary">
                  Retour à l'accueil
                </Button>
              </Link>
              <Link to="/flames">
                <Button variant="outline" className="w-full">
                  Voir mes réservations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !offer) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Chargement...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <Link to={`/offer/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-lg font-poppins font-bold text-gradient-primary">
            Réservation
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 1 ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-gradient-primary' : 'bg-muted'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 2 ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-gradient-primary' : 'bg-muted'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 3 ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>

        {/* Offer Summary */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-0">
            <div className="flex">
              <img 
                src={offer.image_url || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=400&h=300&fit=crop"} 
                alt={offer.title}
                className="w-24 h-24 object-cover rounded-l-xl"
              />
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-foreground">{offer.title}</h3>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-warning fill-current" />
                  <span className="text-xs text-muted-foreground">4.8</span>
                </div>
                <Badge className="bg-gradient-flame text-white mt-2">
                  Offre spéciale
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 1 && (
          <>
            {/* Booking Details */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Détails de la réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-secondary" />
                    <span className="text-sm text-foreground">Aujourd'hui</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-secondary" />
                    <span className="text-sm text-foreground">16h00 - 18h00</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span className="text-sm text-foreground">{offer.location}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Nombre de participants</Label>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, participants: Math.max(1, prev.participants - 1) }))}
                    >
                      -
                    </Button>
                    <Input 
                      id="participants"
                      type="number" 
                      value={formData.participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, participants: parseInt(e.target.value) || 1 }))}
                      className="w-20 text-center"
                      min="1"
                      max="8"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, participants: Math.min(8, prev.participants + 1) }))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
                  <Textarea 
                    id="requests"
                    placeholder="Ex: Célébration d'anniversaire, besoins particuliers..."
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-gradient-primary" 
              size="lg"
              onClick={() => setStep(2)}
            >
              Continuer vers le paiement
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Payment Details */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix unitaire</span>
                  <span className="text-foreground line-through">{mockOffer.originalPrice}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix avec réduction</span>
                  <span className="text-foreground">{mockOffer.discountedPrice}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="text-foreground">×{formData.participants}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-gradient-primary">{offer.price ? `${offer.price} x ${formData.participants}` : "Prix sur demande"}</span>
                </div>
                {offer.price && (
                  <div className="text-xs text-success text-center">
                    Économie: 5€ x {formData.participants} = {5 * formData.participants}€
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-primary" 
                size="lg"
                onClick={handleSubmit}
              >
                <CreditCard size={20} className="mr-2" />
                Confirmer et payer
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}