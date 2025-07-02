import { cn } from "@/lib/utils";
import { OfferCard } from "./offer-card";
import { useEffect, useState } from "react";

interface Offer {
  id: string;
  title: string;
  business: string;
  description: string;
  location: string;
  timeSlot: string;
  date: string;
  discount: string;
  category: string;
  image?: string;
  video?: string;
  flames: number;
  isLiked?: boolean;
}

interface FeedContainerProps {
  offers: Offer[];
  hasGivenFlame?: boolean;
  likedOffers?: Set<string>;
  onLike?: (id: string) => void;
  onBook?: (id: string) => void;
  className?: string;
}

export function FeedContainer({ 
  offers, 
  hasGivenFlame = false,
  likedOffers = new Set(),
  onLike, 
  onBook, 
  className 
}: FeedContainerProps) {
  const [visibleOffers, setVisibleOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading initial offers
    setIsLoading(true);
    setTimeout(() => {
      setVisibleOffers(offers.slice(0, 5));
      setIsLoading(false);
    }, 500);
  }, [offers]);

  const loadMoreOffers = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentLength = visibleOffers.length;
      const newOffers = offers.slice(currentLength, currentLength + 3);
      setVisibleOffers(prev => [...prev, ...newOffers]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Feed header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md p-4 border-b border-border/50">
        <h2 className="text-xl font-poppins font-bold text-gradient-primary">
          Offres du moment 🔥
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Découvre les meilleures activités près de chez toi
        </p>
      </div>

      {/* Offers feed */}
      <div className="px-4 space-y-6">
        {visibleOffers.map((offer, index) => (
          <div 
            key={offer.id}
            className="animate-bounce-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <OfferCard
              {...offer}
              isLiked={likedOffers.has(offer.id)}
              hasGivenFlame={hasGivenFlame}
              onLike={onLike}
              onBook={onBook}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Load more button */}
        {!isLoading && visibleOffers.length < offers.length && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMoreOffers}
              className={cn(
                "px-6 py-3 rounded-full bg-gradient-primary text-white font-semibold",
                "hover:opacity-90 transition-opacity duration-300",
                "hover-lift"
              )}
            >
              Voir plus d'offres
            </button>
          </div>
        )}

        {/* End of feed message */}
        {visibleOffers.length === offers.length && offers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Tu as vu toutes les offres disponibles ! 🎉
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Reviens plus tard pour de nouvelles activités
            </p>
          </div>
        )}
      </div>
    </div>
  );
}