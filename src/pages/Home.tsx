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
import { usePromotions } from "@/hooks/usePromotions";
import { FeedContainer } from "@/components/ui/feed-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Star, Zap, Flame, Filter } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { Link } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { dailyFlame, giveFlame, removeFlame, hasGivenFlameToOffer, canGiveFlame } = useFlames();
  const { activePromotions } = usePromotions();

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

  const { data: flamesCounts = {} } = useQuery({
    queryKey: ["flamesCounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_flames_daily")
        .select("offer_id")
        .not("offer_id", "is", null);
      
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

  const handleLike = async (offerId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const hasFlameOnThisOffer = hasGivenFlameToOffer(offerId);
    
    if (hasFlameOnThisOffer) {
      await removeFlame();
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
            {/* Flames counter */}
            <div className="flex items-center gap-1 bg-gradient-flame rounded-full px-3 py-1">
              <Flame size={14} className="text-white fill-current animate-pulse" />
              <span className="text-white text-sm font-semibold">
                {dailyFlame?.offer_id ? 0 : 1} flamme{dailyFlame?.offer_id ? 's' : ''}
              </span>
            </div>
            
            {/* Real-time notifications counter */}
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative hover:scale-110 transition-transform duration-200">
                <Bell size={20} />
                {/* Only show badge if there are unread notifications */}
                {/* Remove default badge, will be implemented with real notifications */}
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
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-1" />
            Filtrer
          </Button>
        </div>
        
        {/* Promotional Offers */}
        <div className="space-y-4">
          {activePromotions.map((promotion) => {
            // Find the corresponding offer
            const offer = offers.find(o => o.id === promotion.offer_id);
            if (!offer) return null;
            
            return (
              <PromoCard
                key={promotion.id}
                id={offer.id}
                title={offer.title}
                business="Business Name" // You'll need to fetch this from profiles
                description={offer.description}
                location={offer.location}
                category={offer.category}
                image={offer.image_url}
                video={offer.video_url}
                originalPrice={promotion.original_price}
                promotionalPrice={promotion.promotional_price}
                discountText={promotion.discount_text}
                endDate={promotion.end_date}
                flames={flamesCounts[offer.id] || 0}
                maxParticipants={promotion.max_participants}
                onLike={() => handleLike(offer.id)}
                onBook={() => handleBook(offer.id)}
                isLiked={hasGivenFlameToOffer(offer.id)}
              />
            );
          })}
          
          {/* Regular offers (fallback if no promotions) */}
          {activePromotions.length === 0 && (
            <>
              <div className="text-center py-8">
                <Zap className="mx-auto text-4xl text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune offre flash disponible pour le moment.</p>
                <p className="text-sm text-muted-foreground mt-1">Revenez plus tard pour découvrir les meilleures promos !</p>
              </div>
              
              {/* Show regular offers as fallback */}
              {offers.slice(0, 3).map((offer) => (
                <OfferCard
                  key={offer.id}
                  id={offer.id}
                  title={offer.title}
                  business_user_id={offer.business_user_id}
                  location={offer.location}
                  category={offer.category}
                  flames={flamesCounts[offer.id] || 0}
                  image={offer.image_url}
                  price={offer.price}
                  description={offer.description}
                />
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}