import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OfferCard } from "@/components/ui/offer-card";
import { PromoCard } from "@/components/ui/promo-card";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useFlames } from "@/hooks/useFlames";
import { useOfferScoring } from "@/hooks/useOfferScoring";
import { useFlashOffers } from "@/hooks/useFlashOffers";
import { FeedContainer } from "@/components/ui/feed-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterModal } from "@/components/ui/filter-modal";
import { Bell, Search, Star, Zap, Flame, Filter } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { Link } from "react-router-dom";
import { SearchSuggestions } from "@/components/SearchSuggestions";

// Mock data for demonstration
const mockOffers = [
  {
    id: "1",
    title: "Bowling Party 🎳",
    business: "Strike Zone",
    description: "2 heures de bowling + chaussures incluses. Parfait pour s'amuser entre amis après les cours !",
    location: "15 Rue de la République, Lyon",
    timeSlot: "16h00 - 18h00",
    date: "Aujourd'hui",
    discount: "Une partie gratuite",
    category: "Bowling",
    image: "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop",
    video: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    flames: 247,
    isLiked: false
  },
  {
    id: "2", 
    title: "Laser Game Epic 🔫",
    business: "Galaxy Arena",
    description: "Session laser game avec 3 parties incluses. Action et adrénaline garanties !",
    location: "Centre Commercial Part-Dieu",
    timeSlot: "14h30 - 16h00",
    date: "Demain",
    discount: "50% de réduction",
    category: "Laser Game",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
    flames: 189,
    isLiked: false
  },
  {
    id: "3",
    title: "Karaoké VIP 🎤",
    business: "Sing & Dance",
    description: "Salon privé pour 8 personnes avec boissons incluses. Chante tes hits préférés !",
    location: "Quartier Bellecour, Lyon",
    timeSlot: "19h00 - 22h00",
    date: "Vendredi",
    discount: "Salon gratuit",
    category: "Karaoké",
    video: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    flames: 156,
    isLiked: false
  },
  {
    id: "4",
    title: "Escape Game Mystery 🔐",
    business: "Enigma Room",
    description: "Résoudre l'énigme du manoir hanté. Niveau difficile, équipe de 4 à 6 personnes.",
    location: "Vieux Lyon",
    timeSlot: "15h00 - 16h30",
    date: "Samedi",
    discount: "Entrée à 5€",
    category: "Escape Game",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    flames: 203,
    isLiked: false
  },
  {
    id: "5",
    title: "Billard & Snacks 🎱",
    business: "Pool Paradise",
    description: "Table de billard réservée pour 2h avec nachos et boissons à volonté.",
    location: "Presqu'île, Lyon",
    timeSlot: "17h00 - 19h00",
    date: "Dimanche",
    discount: "2h pour le prix d'1h",
    category: "Billard",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=600&fit=crop",
    flames: 92,
    isLiked: false
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    maxDistance: [10],
    priceRange: [0, 100],
    participants: "all",
    timeSlot: "all"
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { giveFlame, removeFlame, hasGivenFlameToOffer, canGiveFlame } = useFlames();
  const { scoredOffers } = useOfferScoring();
  const { flashOffers, loading: flashOffersLoading } = useFlashOffers();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get IDs of offers that have flash promotions to exclude them from regular offers
  const flashOfferIds = new Set(flashOffers.map(offer => offer.id));

  // Apply filters and exclude offers that are in flash offers
  const filteredOffers = offers.filter(offer => {
    // Exclude offers that are currently in flash promotions
    if (flashOfferIds.has(offer.id)) {
      return false;
    }
    
    // Category filter
    if (filters.category !== "all" && offer.category?.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    
    return true;
  });

  // Apply filters to flash offers as well
  const filteredFlashOffers = flashOffers.filter(offer => {
    // Category filter
    if (filters.category !== "all" && offer.category?.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Sort offers based on scoring algorithm
  const sortedOffers = user && scoredOffers.length > 0 
    ? filteredOffers.sort((a, b) => {
        const scoreA = scoredOffers.find(s => s.offerId === a.id)?.score || 0;
        const scoreB = scoredOffers.find(s => s.offerId === b.id)?.score || 0;
        return scoreB - scoreA;
      })
    : filteredOffers;

  const { data: flamesCounts = {} } = useQuery({
    queryKey: ["flamesCounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flames")
        .select("offer_id");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(flame => {
        if (flame.offer_id) {
          counts[flame.offer_id] = (counts[flame.offer_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Récupérer le nombre de notifications non lues
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 0, // Les données sont immédiatement considérées comme obsolètes
  });

  const handleLike = async (offerId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const hasFlameOnThisOffer = hasGivenFlameToOffer(offerId);
    
    if (hasFlameOnThisOffer) {
      await removeFlame(offerId);
    } else {
      await giveFlame(offerId);
    }
    
    // Refresh flame counts
    queryClient.invalidateQueries({ queryKey: ["flamesCounts"] });
  };


  const handleBook = (offerId: string) => {
    console.log(`Booking offer: ${offerId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
              Ludigo
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm ml-3">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une activité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <SearchSuggestions
                query={searchQuery}
                onSelect={(suggestion) => setSearchQuery(suggestion)}
                isVisible={!!searchQuery}
              />
            </div>
            
            {/* Real-time notifications counter */}
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative hover:scale-110 transition-transform duration-200">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>



      {/* Flash Offers Section */}
      <section className="p-4 space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-orange-500 animate-pulse" />
            <h2 className="text-xl font-bold text-gradient-primary">Offres Flash</h2>
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-bounce">
              LIMITÉ
            </Badge>
          </div>
        </div>
        
        {/* Promotional Offers */}
        <div className="space-y-4">
          {flashOffersLoading ? (
            <div className="text-center py-8">
              <Zap className="mx-auto text-4xl text-primary animate-pulse mb-2" />
              <p className="text-muted-foreground">Chargement des offres flash...</p>
            </div>
          ) : filteredFlashOffers.length > 0 ? (
            <>
              {filteredFlashOffers.map((offer) => {
                const imageUrls = Array.isArray(offer.image_urls) 
                  ? offer.image_urls.filter((url): url is string => typeof url === 'string')
                  : [];
                
                return (
                  <PromoCard
                    key={offer.id}
                    id={offer.id}
                    promotionId={offer.id}
                    offerId={offer.id}
                    businessUserId={offer.business_user_id}
                    title={offer.title}
                    business={offer.business_user_id}
                    description={offer.description}
                    location={offer.address || offer.location}
                    category={offer.category}
                    image={offer.image_url || undefined}
                    image_urls={imageUrls.length > 0 ? imageUrls : undefined}
                    video={offer.video_url}
                    originalPrice={offer.original_price}
                    promotionalPrice={offer.promotional_price}
                    discountText={`${offer.discount_percentage}% de réduction`}
                    endDate={offer.endDate.toISOString()}
                    flames={flamesCounts[offer.id] || 0}
                    latitude={offer.latitude ? parseFloat(offer.latitude.toString()) : undefined}
                    longitude={offer.longitude ? parseFloat(offer.longitude.toString()) : undefined}
                  />
                );
              })}
            </>
          ) : (
            <div className="text-center py-8">
              <Zap className="mx-auto text-4xl text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucune offre flash disponible pour le moment.</p>
              <p className="text-sm text-muted-foreground mt-1">Revenez plus tard pour découvrir les meilleures promos !</p>
            </div>
          )}
        </div>
      </section>

      {/* Regular Offers Section */}
      <section className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="text-primary" />
            <h2 className="text-xl font-bold text-gradient-primary">Toutes les activités</h2>
          </div>
        </div>
        
        <div className="space-y-4">
          {sortedOffers.map((offer) => {
            const imageUrls = Array.isArray(offer.image_urls) 
              ? offer.image_urls.filter((url): url is string => typeof url === 'string')
              : [];
            
            return (
              <OfferCard
                key={offer.id}
                id={offer.id}
                title={offer.title}
                business_user_id={offer.business_user_id}
                location={offer.address || offer.location}
                category={offer.category}
                image={offer.image_url || undefined}
                image_urls={imageUrls.length > 0 ? imageUrls : undefined}
                description={offer.description}
                flames={flamesCounts[offer.id] || 0}
                latitude={offer.latitude ? parseFloat(offer.latitude.toString()) : undefined}
                longitude={offer.longitude ? parseFloat(offer.longitude.toString()) : undefined}
              />
            );
          })}
          
          {sortedOffers.length === 0 && (
            <div className="text-center py-8">
              <Star className="mx-auto text-4xl text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aucune activité disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}