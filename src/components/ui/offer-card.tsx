import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Flame, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useFlames } from "@/hooks/useFlames";
import { useQueryClient } from "@tanstack/react-query";

interface OfferCardProps {
  id: string;
  title: string;
  business?: string;
  business_user_id?: string;
  location: string;
  discount?: string;
  category: string;
  flames: number;
  image?: string;
  price?: string;
  description?: string;
}

export function OfferCard({ 
  id, 
  title, 
  business, 
  business_user_id,
  location, 
  discount, 
  category, 
  flames, 
  image, 
  price, 
  description 
}: OfferCardProps) {
  const { giveFlame, hasGivenFlameToOffer, canGiveFlame } = useFlames();
  const queryClient = useQueryClient();

  const handleFlameClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!canGiveFlame()) {
      // Navigate to auth page if not logged in
      window.location.href = '/auth';
      return;
    }
    
    await giveFlame(id);
    // Refresh flame counts to update UI without page reload
    queryClient.invalidateQueries({ queryKey: ["flamesCounts"] });
  };


  return (
    <div className="mb-4">
      <Link to={`/offer/${id}`}>
        <Card className="bg-gradient-card border-border/50 hover-lift overflow-hidden h-[380px]">
          <div className="relative aspect-[3/2]">
            <img 
              src={image || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"} 
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-sm"
            >
              {category}
            </Badge>
            
            {/* Compteur de flammes en bas à droite de l'image */}
            <div className="absolute bottom-3 right-3 bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1">
              <Flame size={12} className="fill-current" />
              {flames}
            </div>
            
            {discount && (
              <Badge 
                className="absolute top-3 right-3 bg-gradient-flame text-white font-bold animate-pulse-glow"
              >
                {discount}
              </Badge>
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-base text-foreground line-clamp-1">
                  {title}
                </h3>
                {business && (
                  <p className="text-xs text-muted-foreground">
                    {business}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={12} className="text-primary" />
                <span className="line-clamp-1">{location}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFlameClick}
                disabled={!canGiveFlame()}
                className={`flex items-center gap-2 px-4 py-2 h-10 rounded-lg ${
                  hasGivenFlameToOffer(id) 
                    ? 'bg-red-500 hover:bg-red-600 text-white font-medium' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white font-medium'
                }`}
              >
                <Flame 
                  size={16} 
                  className={hasGivenFlameToOffer(id) ? 'fill-current' : ''} 
                />
                <span className="text-sm">
                  {hasGivenFlameToOffer(id) ? 'Retirer' : 'Flamme'}
                </span>
              </Button>
              
              <Link 
                to={canGiveFlame() ? `/booking/${id}` : '/auth'}
                onClick={(e) => {
                  if (!canGiveFlame()) {
                    e.preventDefault();
                    window.location.href = '/auth';
                  }
                }}
              >
                <Button 
                  size="sm" 
                  className="bg-gradient-primary hover:opacity-90 px-4 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar size={14} className="mr-1" />
                  Réserver
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}