import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/components/ui/video-player";
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Clock, 
  Calendar, 
  Star, 
  Users, 
  Phone,
  Globe,
  Instagram,
  Share
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const mockOffer = {
  id: "1",
  title: "Bowling Party 🎳",
  business: "Strike Zone",
  description: "2 heures de bowling + chaussures incluses. Parfait pour s'amuser entre amis après les cours ! Venez découvrir notre nouveau bowling avec 12 pistes modernes, système de score automatique et éclairage LED.",
  location: "15 Rue de la République, Lyon",
  timeSlot: "16h00 - 18h00",
  date: "Aujourd'hui",
  discount: "Une partie gratuite",
  category: "Bowling",
  image: "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop",
  video: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
  flames: 247,
  rating: 4.8,
  reviewCount: 124,
  capacity: "2-8 personnes",
  business_profile: {
    name: "Strike Zone",
    description: "Le meilleur bowling de Lyon ! Ouvert depuis 2015, nous proposons une expérience unique avec nos 12 pistes modernes.",
    address: "15 Rue de la République, 69002 Lyon",
    phone: "04 78 42 33 21",
    website: "www.strikezone-lyon.fr",
    instagram: "@strikezone_lyon",
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop",
    rating: 4.8,
    reviewCount: 324,
    openingHours: {
      "Lundi - Jeudi": "14h00 - 23h00",
      "Vendredi - Samedi": "14h00 - 01h00",
      "Dimanche": "14h00 - 22h00"
    }
  }
};

export default function OfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showBusiness, setShowBusiness] = useState(false);

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

      // Track view when offer is loaded
      if (data) {
        await supabase
          .from("offer_views")
          .insert({
            offer_id: data.id,
            user_id: user?.id || null
          });
      }
      
      return data;
    },
    enabled: !!id,
  });

  const { data: userFlame } = useQuery({
    queryKey: ["userFlame", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from("flames")
        .select("*")
        .eq("user_id", user.id)
        .eq("offer_id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: flamesCount = 0 } = useQuery({
    queryKey: ["flamesCount", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("flames")
        .select("*", { count: "exact", head: true })
        .eq("offer_id", id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  if (isLoading || !offer) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Chargement...</div>
    </div>;
  }

  const handleLike = async () => {
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = "/auth";
      return;
    }

    try {
      if (userFlame) {
        // Remove flame
        await supabase
          .from("flames")
          .delete()
          .eq("user_id", user.id)
          .eq("offer_id", id!);
      } else {
        // Add flame
        await supabase
          .from("flames")
          .insert({
            user_id: user.id,
            offer_id: id!,
          });
      }
    } catch (error) {
      console.error("Error toggling flame:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: offer.title,
        text: offer.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="icon" className="lg:w-12 lg:h-12">
                <ArrowLeft size={20} className="lg:w-6 lg:h-6" />
              </Button>
            </Link>
            <h1 className="text-lg lg:text-xl font-poppins font-bold text-gradient-primary">
              Détails de l'offre
            </h1>
            <Button variant="ghost" size="icon" onClick={handleShare} className="lg:w-12 lg:h-12">
              <Share size={20} className="lg:w-6 lg:h-6" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Media */}
          <div className="relative aspect-[16/10] lg:aspect-square lg:sticky lg:top-24">
            {offer.video_url ? (
              <VideoPlayer 
                src={offer.video_url}
                poster={offer.image_url || undefined}
                className="w-full h-full"
              />
            ) : (
              <img 
                src={offer.image_url || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"} 
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Floating badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Badge variant="secondary" className="bg-secondary/90 backdrop-blur-sm lg:text-sm lg:px-3 lg:py-1">
                {offer.category}
              </Badge>
              <Badge className="bg-gradient-flame text-white font-bold animate-pulse-glow lg:text-sm lg:px-3 lg:py-1">
                Offre spéciale
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-0 space-y-6 lg:space-y-8">
            {/* Main Info */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-foreground mb-2 lg:mb-4">
                {offer.title}
              </h1>
              
              {/* Business info with click handler */}
              <button 
                onClick={() => setShowBusiness(!showBusiness)}
                className="flex items-center gap-2 mb-3 lg:mb-4 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
                  <AvatarImage src={mockOffer.business_profile.logo} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs lg:text-sm">
                    {mockOffer.business.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground lg:text-lg">{mockOffer.business}</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-warning fill-current lg:w-4 lg:h-4" />
                  <span className="text-sm lg:text-base text-muted-foreground">{mockOffer.rating} ({mockOffer.reviewCount})</span>
                </div>
              </button>

              <p className="text-muted-foreground leading-relaxed lg:text-lg">
                {offer.description}
              </p>
            </div>

            {/* Business Profile Modal/Card */}
            {showBusiness && (
              <Card className="bg-gradient-card border-border/50 animate-fade-in">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <Avatar className="w-12 h-12 lg:w-16 lg:h-16">
                      <AvatarImage src={mockOffer.business_profile.logo} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground lg:text-lg">
                        {mockOffer.business.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-poppins font-bold text-foreground lg:text-xl">{mockOffer.business_profile.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-warning fill-current lg:w-4 lg:h-4" />
                        <span className="text-sm lg:text-base text-muted-foreground">
                          {mockOffer.business_profile.rating} ({mockOffer.business_profile.reviewCount} avis)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm lg:text-base text-muted-foreground mb-4 lg:mb-6">
                    {mockOffer.business_profile.description}
                  </p>

                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary lg:w-5 lg:h-5" />
                      <span className="text-sm lg:text-base text-foreground">{mockOffer.business_profile.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-secondary lg:w-5 lg:h-5" />
                      <span className="text-sm lg:text-base text-foreground">{mockOffer.business_profile.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-info lg:w-5 lg:h-5" />
                      <span className="text-sm lg:text-base text-foreground">{mockOffer.business_profile.website}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Instagram size={16} className="text-destructive lg:w-5 lg:h-5" />
                      <span className="text-sm lg:text-base text-foreground">{mockOffer.business_profile.instagram}</span>
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-border/50">
                    <h4 className="font-semibold text-foreground mb-2 lg:mb-4 lg:text-lg">Horaires d'ouverture</h4>
                    {Object.entries(mockOffer.business_profile.openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm lg:text-base">
                        <span className="text-muted-foreground">{day}</span>
                        <span className="text-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary lg:w-5 lg:h-5" />
                  <span className="text-foreground lg:text-lg">{offer.location}</span>
                </div>
                
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-secondary lg:w-5 lg:h-5" />
                    <span className="text-foreground lg:text-lg">{mockOffer.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-secondary lg:w-5 lg:h-5" />
                    <span className="text-foreground lg:text-lg">{mockOffer.timeSlot}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-info lg:w-5 lg:h-5" />
                  <span className="text-foreground lg:text-lg">{mockOffer.capacity}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 lg:gap-4">
              <Button
                variant="outline"
                onClick={handleLike}
                className={`flex-1 lg:h-12 lg:text-lg ${userFlame ? 'bg-flame/10 border-flame text-flame' : ''}`}
              >
                <Heart 
                  size={18} 
                  className={`mr-2 lg:w-5 lg:h-5 ${userFlame ? 'fill-current' : ''}`} 
                />
                {flamesCount} Flammes
              </Button>
              
              <Link to={`/booking/${id}`} className="flex-1">
                <Button className="w-full bg-gradient-primary hover:opacity-90 lg:h-12 lg:text-lg">
                  Réserver maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}