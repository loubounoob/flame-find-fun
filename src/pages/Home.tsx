import { FeedContainer } from "@/components/ui/feed-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Star, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useState } from "react";
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasGivenFlame, setHasGivenFlame] = useState(false);
  const [likedOffers, setLikedOffers] = useState<Set<string>>(new Set());

  const handleLike = (offerId: string) => {
    if (!hasGivenFlame) {
      setHasGivenFlame(true);
      setLikedOffers(new Set([offerId]));
    } else if (likedOffers.has(offerId)) {
      setHasGivenFlame(false);
      setLikedOffers(new Set());
    }
  };

  const handleBook = (offerId: string) => {
    if (!isSubscribed) {
      alert("Abonne-toi pour réserver cette offre ! 🔥");
      return;
    }
    console.log(`Booking offer: ${offerId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
              FlameUp
            </h1>
            <p className="text-xs text-muted-foreground">Lyon • Étudiant</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Flames counter */}
            <div className="flex items-center gap-1 bg-gradient-flame rounded-full px-3 py-1">
              <Zap size={14} className="text-white" />
              <span className="text-white text-sm font-semibold">
                {hasGivenFlame ? 0 : 1} flamme{hasGivenFlame ? 's' : ''}
              </span>
            </div>
            
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-flame text-white text-xs p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <img 
            src={heroImage} 
            alt="FlameUp Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl md:text-4xl font-poppins font-bold text-white">
                Découvre les offres les plus 🔥
              </h2>
              <p className="text-white/90 text-sm">
                Bowling, laser game, escape game... Des activités folles à prix mini !
              </p>
              
              {!isSubscribed && (
                <Link to="/subscription">
                  <Button 
                    variant="premium" 
                    size="lg"
                    className="animate-bounce-in"
                  >
                    <Star className="mr-2" size={18} />
                    S'abonner - 20€/mois
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-card rounded-xl p-3 text-center border border-border/50">
            <div className="text-lg font-bold text-gradient-primary">247</div>
            <div className="text-xs text-muted-foreground">Offres actives</div>
          </div>
          <div className="bg-gradient-card rounded-xl p-3 text-center border border-border/50">
            <div className="text-lg font-bold text-gradient-flame">1.2k</div>
            <div className="text-xs text-muted-foreground">Flammes données</div>
          </div>
          <div className="bg-gradient-card rounded-xl p-3 text-center border border-border/50">
            <div className="text-lg font-bold text-gradient-secondary">89</div>
            <div className="text-xs text-muted-foreground">Entreprises</div>
          </div>
        </div>
      </section>

      {/* Subscription Status */}
      {!isSubscribed && (
        <section className="mx-4 mb-4">
          <div className="bg-gradient-primary rounded-xl p-4 text-center">
            <h3 className="text-white font-semibold mb-2">
              🔒 Mode Découverte
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Tu peux voir les offres mais pas les réserver. Abonne-toi pour débloquer toutes les activités !
            </p>
            <Link to="/subscription">
              <Button 
                variant="secondary" 
                size="sm"
              >
                Découvrir l'abonnement
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Main Feed */}
      <FeedContainer 
        offers={mockOffers}
        hasGivenFlame={hasGivenFlame}
        likedOffers={likedOffers}
        onLike={handleLike}
        onBook={handleBook}
      />
    </div>
  );
}