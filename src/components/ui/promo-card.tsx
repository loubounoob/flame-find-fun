import { useState, useEffect } from "react";
import { Card } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Clock, Zap, Users, MapPin, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFlames } from "@/hooks/useFlames";
import { useAuth } from "@/hooks/useAuth";

interface PromoCardProps {
  id: string;
  promotionId: string;
  offerId: string;
  businessUserId: string;
  title: string;
  business: string;
  description: string;
  location: string;
  category: string;
  image?: string;
  video?: string;
  originalPrice: number;
  promotionalPrice: number;
  discountText: string;
  endDate: string;
  flames: number;
  maxParticipants?: number;
  className?: string;
}

export function PromoCard({
  id,
  promotionId,
  offerId,
  businessUserId,
  title,
  business,
  description,
  location,
  category,
  image,
  video,
  originalPrice,
  promotionalPrice,
  discountText,
  endDate,
  flames: initialFlames,
  maxParticipants,
  className
}: PromoCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasGivenFlameToOffer, giveFlame, removeFlame, isLoading: flameLoading } = useFlames();
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [currentFlames, setCurrentFlames] = useState(initialFlames);
  const isLiked = hasGivenFlameToOffer(offerId);

  // Real-time countdown
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Expiré");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}j ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}min`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}min ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const handleCardClick = () => {
    navigate(`/offer/${offerId}`);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleBookClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour réserver cette offre flash.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setIsBooking(true);
    
    try {
      // Call Stripe payment
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          offerId,
          promotionId,
          amount: promotionalPrice,
          participantCount: 1
        }
      });

      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        "border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5",
        isExpired && "opacity-60 grayscale",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Promo Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge 
          variant="destructive" 
          className={cn(
            "bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold",
            "animate-bounce shadow-lg px-3 py-1",
            "border-2 border-white/20"
          )}
        >
          <Zap size={12} className="mr-1" />
          {discountText}
        </Badge>
      </div>

      {/* Countdown Timer */}
      <div className="absolute top-3 right-3 z-10">
        <Badge 
          variant="outline" 
          className={cn(
            "bg-black/80 text-white border-white/20 font-mono",
            "animate-pulse",
            isExpired && "bg-red-900/80"
          )}
        >
          <Clock size={12} className="mr-1" />
          {timeLeft}
        </Badge>
      </div>

      {/* Media */}
      <div className="relative aspect-video overflow-hidden">
        {video ? (
          <video
            src={video}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Zap size={48} className="text-primary/50" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-background/90 text-foreground">
            {category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm font-medium">{business}</p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin size={14} />
          <span className="text-sm line-clamp-1">{location}</span>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {promotionalPrice.toFixed(2)}€
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {originalPrice.toFixed(2)}€
          </span>
          <Badge variant="secondary" className="ml-auto">
            -{Math.round(((originalPrice - promotionalPrice) / originalPrice) * 100)}%
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-primary" />
              <span className="font-medium">{currentFlames}</span>
            </div>
            {maxParticipants && (
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>Max {maxParticipants}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 transition-all duration-300",
              "hover:scale-105 active:scale-95"
            )}
            onClick={(e) => handleButtonClick(e, async () => {
              if (isLiked) {
                await removeFlame();
                setCurrentFlames(prev => prev - 1);
              } else {
                await giveFlame(offerId);
                setCurrentFlames(prev => prev + 1);
              }
            })}
            disabled={isExpired || flameLoading}
          >
            <Flame size={16} className={cn("mr-1", isLiked && "fill-current")} />
            Flamme
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className={cn(
              "flex-1 transition-all duration-300",
              "hover:scale-105 active:scale-95"
            )}
            onClick={(e) => handleButtonClick(e, () => navigate(`/booking-form/${offerId}`))}
            disabled={isExpired}
          >
            <Zap size={16} className="mr-1" />
            {isExpired ? "Expiré" : "Réserver"}
          </Button>
        </div>
      </div>
    </Card>
  );
}