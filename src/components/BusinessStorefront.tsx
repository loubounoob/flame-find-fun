import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/components/ui/video-player";
import { ShareButton } from "@/components/ShareButton";
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Star, 
  Users, 
  Phone,
  Globe,
  Flame,
  Image,
  Video,
  ShoppingCart,
  Check
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function BusinessStorefront() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBusiness, setShowBusiness] = useState(false);

  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer-storefront", id],
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

  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile", offer?.business_user_id],
    queryFn: async () => {
      if (!offer?.business_user_id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, website, bio, avatar_url, opening_hours, business_name")
        .eq("user_id", offer.business_user_id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!offer?.business_user_id,
  });

  const { data: businessPricing = [] } = useQuery({
    queryKey: ["businessPricing", offer?.business_user_id],
    queryFn: async () => {
      if (!offer?.business_user_id) return [];
      const { data, error } = await supabase
        .from("business_pricing")
        .select("*")
        .eq("business_user_id", offer.business_user_id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!offer?.business_user_id,
  });

  const { data: businessMedia = [] } = useQuery({
    queryKey: ["businessMedia", offer?.business_user_id],
    queryFn: async () => {
      if (!offer?.business_user_id) return [];
      const { data, error } = await supabase
        .from("business_media")
        .select("*")
        .eq("business_user_id", offer.business_user_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!offer?.business_user_id,
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["offerRatings", id],
    queryFn: async () => {
      if (!id) return [];
      const { data: ratingsData, error } = await supabase
        .from("offer_ratings")
        .select("*")
        .eq("offer_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const ratingsWithProfiles = await Promise.all(
        (ratingsData || []).map(async (rating) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("user_id", rating.user_id)
            .single();
          
          return {
            ...rating,
            profiles: profile
          };
        })
      );
      
      return ratingsWithProfiles;
    },
    enabled: !!id,
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

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0;

  if (isLoading || !offer) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Chargement de la boutique...</div>
    </div>;
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
  };

  const handleBookNow = () => {
    navigate(`/shopify-booking/${id}`, { 
      state: { selectedService, offer, businessProfile } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-lg font-poppins font-bold text-gradient-primary">
            {businessProfile?.business_name || businessProfile?.first_name + ' ' + businessProfile?.last_name}
          </h1>
          <ShareButton 
            title={offer.title}
            description={offer.description}
            variant="ghost"
            size="icon"
          />
        </div>
      </header>

      <div className="space-y-6">
        {/* Hero Section with Media */}
        <div className="relative aspect-[16/10]">
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
          
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Badge variant="secondary" className="bg-secondary/90 backdrop-blur-sm">
              {offer.category}
            </Badge>
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
              <Flame size={16} className="text-orange-500" />
              <span className="font-bold text-sm">{flamesCount} flames</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Business Info */}
          <div className="text-center space-y-4">
            {businessProfile && (
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={businessProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                    {businessProfile.first_name?.charAt(0)}{businessProfile.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-poppins font-bold text-foreground">
                    {businessProfile.business_name || `${businessProfile.first_name} ${businessProfile.last_name}`}
                  </h1>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star size={16} className="text-warning fill-current" />
                    <span className="text-sm text-muted-foreground">
                      {averageRating > 0 ? averageRating.toFixed(1) : "Nouveau"} 
                      {ratings.length > 0 && ` (${ratings.length} avis)`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin size={16} />
              <span>{offer.location}</span>
            </div>

            {businessProfile?.bio && (
              <p className="text-foreground leading-relaxed max-w-2xl mx-auto">
                {businessProfile.bio}
              </p>
            )}
          </div>

          {/* Services/Pricing Section */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h2 className="text-xl font-poppins font-bold text-foreground mb-4">
                Nos Services
              </h2>
              <div className="space-y-4">
                {businessPricing.map((service) => (
                  <div 
                    key={service.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedService?.id === service.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-foreground">{service.service_name}</h3>
                          {selectedService?.id === service.id && (
                            <Check size={16} className="text-primary" />
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {service.duration_minutes && (
                            <span>⏱️ {service.duration_minutes}min</span>
                          )}
                          {service.max_participants && (
                            <span>👥 Max {service.max_participants} pers.</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-2xl font-bold text-primary">{service.price_amount}€</span>
                        <p className="text-xs text-muted-foreground">{service.price_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          {businessMedia.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Image size={18} className="text-secondary" />
                  <h3 className="font-poppins font-semibold text-foreground">Galerie</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {businessMedia.slice(0, 6).map((media, index) => (
                    <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden">
                      {media.media_type === 'video' ? (
                        <div className="relative">
                          <video 
                            src={media.media_url} 
                            className="w-full h-full object-cover"
                            poster={media.media_url}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video size={24} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={media.media_url} 
                          alt={media.description || `Média ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {businessMedia.length > 6 && index === 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold">+{businessMedia.length - 6}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {ratings.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-warning fill-current" />
                    <h3 className="font-poppins font-semibold text-foreground">
                      Avis clients ({ratings.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${
                            star <= Math.round(averageRating)
                              ? "text-warning fill-current"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                   {ratings.slice(0, 3).map((rating) => (
                     <div key={rating.id} className="border-b border-border/50 pb-4 last:border-0">
                       <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={rating.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-secondary text-xs">
                              {rating.profiles?.first_name?.charAt(0) || 'U'}{rating.profiles?.last_name?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {rating.profiles ? `${rating.profiles.first_name} ${rating.profiles.last_name}` : 'Utilisateur'}
                              </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={12}
                                  className={`${
                                    star <= rating.rating
                                      ? "text-warning fill-current"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-foreground">{rating.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <div className="sticky bottom-4 z-10">
            <Button 
              onClick={handleBookNow}
              disabled={!selectedService}
              className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6 shadow-lg"
            >
              <ShoppingCart size={20} className="mr-2" />
              {selectedService 
                ? `Réserver ${selectedService.service_name} - ${selectedService.price_amount}€`
                : "Sélectionnez un service pour réserver"
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}