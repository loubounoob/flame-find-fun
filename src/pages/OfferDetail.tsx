import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/components/ui/video-player";
import { ShareButton } from "@/components/ShareButton";
import { RatingModal } from "@/components/RatingModal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Clock as ClockIcon, 
  Calendar as CalendarIcon, 
  Star, 
  Users, 
  Phone,
  Globe,
  Instagram,
  Euro,
  Image,
  Video,
  Flame
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOfferSchedule } from "@/hooks/useOfferSchedule";


export default function OfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showBusiness, setShowBusiness] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const { schedules, promotions } = useOfferSchedule(id || "");

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

  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile", offer?.business_user_id],
    queryFn: async () => {
      if (!offer?.business_user_id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, website, bio, avatar_url, opening_hours")
        .eq("user_id", offer.business_user_id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!offer?.business_user_id,
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


  // Récupérer les médias de l'entreprise
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

  // Récupérer les évaluations de l'offre avec les profils utilisateurs
  const { data: ratings = [], refetch: refetchRatings } = useQuery({
    queryKey: ["offerRatings", id],
    queryFn: async () => {
      if (!id) return [];
      const { data: ratingsData, error } = await supabase
        .from("offer_ratings")
        .select("*")
        .eq("offer_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch user profiles for each rating
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

  // Calculer la note moyenne
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0;

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


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-lg font-poppins font-bold text-gradient-primary">
            Détails de l'offre
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
        {/* Media Carousel */}
        <div className="relative aspect-[16/10]">
          {offer.video_url ? (
            <VideoPlayer 
              src={offer.video_url}
              poster={offer.image_url || undefined}
              className="w-full h-full"
            />
          ) : (
            <>
              {Array.isArray(offer.image_urls) && offer.image_urls.length > 0 ? (
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full">
                    {(offer.image_urls as string[]).map((imgUrl: string, idx: number) => (
                      <CarouselItem key={idx} className="h-full">
                        <div className="relative w-full h-full">
                          <img 
                            src={imgUrl || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"} 
                            alt={`${offer.title} - Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Image counter */}
                          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                            {idx + 1}/{(offer.image_urls as string[]).length}
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-black/50 border-none text-white hover:bg-black/70" />
                  <CarouselNext className="right-2 bg-black/50 border-none text-white hover:bg-black/70" />
                </Carousel>
              ) : (
                <img 
                  src={offer.image_url || "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"} 
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
              )}
            </>
          )}
          
          {/* Floating badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <Badge variant="secondary" className="bg-secondary/90 backdrop-blur-sm">
              {offer.category}
            </Badge>
            <Badge className="bg-gradient-flame text-white font-bold animate-pulse-glow">
              Offre spéciale
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Main Info */}
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground mb-2">
              {offer.title}
            </h1>
            
            {/* Business info with click handler */}
            {businessProfile && (
              <button 
                onClick={() => setShowBusiness(!showBusiness)}
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={businessProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {businessProfile.first_name?.charAt(0)}{businessProfile.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {businessProfile.first_name} {businessProfile.last_name}
                </span>
                 <div className="flex items-center gap-1">
                   <Star size={14} className="text-warning fill-current" />
                   <span className="text-sm text-muted-foreground">
                     {averageRating > 0 ? averageRating.toFixed(1) : "Aucun avis"} 
                     {ratings.length > 0 && ` (${ratings.length} avis)`}
                   </span>
                 </div>
              </button>
            )}

            <p className="text-muted-foreground leading-relaxed">
              {offer.description}
            </p>
          </div>

          {/* Business Profile Modal/Card */}
          {showBusiness && businessProfile && (
            <Card className="bg-gradient-card border-border/50 animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={businessProfile.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {businessProfile.first_name?.charAt(0)}{businessProfile.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-poppins font-bold text-foreground">
                      {businessProfile.first_name} {businessProfile.last_name}
                    </h3>
                     <div className="flex items-center gap-1">
                       <Star size={14} className="text-warning fill-current" />
                       <span className="text-sm text-muted-foreground">
                         {averageRating > 0 ? averageRating.toFixed(1) : "Aucun avis"} 
                         {ratings.length > 0 && ` (${ratings.length} avis)`}
                       </span>
                     </div>
                  </div>
                </div>

                {businessProfile.bio && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {businessProfile.bio}
                  </p>
                )}

                <div className="space-y-3">
                  {offer.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      <span className="text-sm text-foreground">{offer.location}</span>
                    </div>
                  )}
                  
                  {businessProfile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-secondary" />
                      <span className="text-sm text-foreground">{businessProfile.phone}</span>
                    </div>
                  )}
                  
                  {businessProfile.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-info" />
                      <span className="text-sm text-foreground">{businessProfile.website}</span>
                    </div>
                  )}
                </div>

                {businessProfile.opening_hours && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="font-semibold text-foreground mb-2">Horaires d'ouverture</h4>
                    <p className="text-sm text-foreground">{businessProfile.opening_hours}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <span className="text-foreground">{offer.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Horaires et Promotions */}
          {(schedules.length > 0 || promotions.length > 0) && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-poppins font-semibold text-foreground flex items-center gap-2">
                  <CalendarIcon size={18} className="text-primary" />
                  Disponibilités
                </h3>
                
                {/* Horaires */}
                {schedules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon size={16} className="text-secondary" />
                      <span className="font-medium text-foreground">Horaires d'ouverture</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {schedules.map((schedule, index) => {
                        const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                        const dayNames = schedule.days_of_week
                          .sort((a, b) => a - b)
                          .map(d => daysMap[d])
                          .join(", ");
                        return (
                          <div key={schedule.id} className="text-sm text-muted-foreground">
                            <span className="font-medium">{dayNames}</span> : {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Promotions */}
                {promotions.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Flame size={16} className="text-warning" />
                      <span className="font-medium text-foreground">Promotions actives</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {promotions.map((promo) => {
                        const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                        const dayNames = promo.days_of_week
                          .sort((a, b) => a - b)
                          .map(d => daysMap[d])
                          .join(", ");
                        return (
                          <Badge key={promo.id} variant="secondary" className="bg-gradient-flame text-white">
                            -{promo.discount_percentage}% • {dayNames} {promo.start_time.substring(0, 5)}-{promo.end_time.substring(0, 5)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Médias de l'entreprise */}
          {businessMedia.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
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

          {/* Évaluations */}
          {ratings.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-warning fill-current" />
                    <h3 className="font-poppins font-semibold text-foreground">
                      Avis ({ratings.length})
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
                  {ratings.length > 3 && (
                    <Button variant="outline" className="w-full">
                      Voir tous les avis ({ratings.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Bouton d'évaluation pour les utilisateurs ayant réservé */}
            {user && (
              <Button 
                variant="outline" 
                onClick={() => setShowRatingModal(true)}
                className="w-full"
              >
                <Star size={18} className="mr-2" />
                Donner votre avis
              </Button>
            )}
            
            <Link to={`/booking-form/${id}`} className="block">
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Réserver maintenant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal d'évaluation */}
      {showRatingModal && (
        <RatingModal
          offerId={id!}
          onClose={() => setShowRatingModal(false)}
          onRatingSubmitted={() => {
            refetchRatings();
          }}
        />
      )}
    </div>
  );
}