import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/ui/video-player";
import { MapPin, Flame, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useFlames } from "@/hooks/useFlames";
import { useQueryClient } from "@tanstack/react-query";
import { useDistance } from "@/hooks/useDistance";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";

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
  image_urls?: string[];
  price?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
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
  image_urls,
  price, 
  description,
  latitude,
  longitude
}: OfferCardProps) {
  const { giveFlame, removeFlame, hasGivenFlameToOffer, canGiveFlame } = useFlames();
  const queryClient = useQueryClient();
  const { getDistance } = useDistance();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter out videos from home page display - only show images
  const imageUrls = image_urls && image_urls.length > 0 
    ? image_urls.filter(url => {
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
        return !isVideo;
      })
    : [];
  
  const images = imageUrls.length > 0
    ? imageUrls
    : image && !/\.(mp4|webm|ogg|mov)$/i.test(image)
    ? [image]
    : ["https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=800&h=600&fit=crop"];

  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleFlameClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!canGiveFlame()) {
      // Navigate to auth page if not logged in
      window.location.href = '/auth';
      return;
    }
    
    const hasFlameOnThisOffer = hasGivenFlameToOffer(id);
    
    if (hasFlameOnThisOffer) {
      await removeFlame(id);
    } else {
      await giveFlame(id);
    }
    
    // Refresh flame counts
    queryClient.invalidateQueries({ queryKey: ["flamesCounts"] });
  };


  return (
    <div className="mb-4">
      <Link to={`/offer/${id}`}>
        <Card className="bg-gradient-card border-border/50 hover-lift overflow-hidden h-[380px]">
          <div className="relative aspect-[3/2]">
            {images.length > 1 ? (
              <div className="relative">
                <Carousel 
                  className="w-full h-full" 
                  opts={{ loop: true }}
                  setApi={setCarouselApi}
                >
                  <CarouselContent>
                    {images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-full">
                          <img 
                            src={img} 
                            alt={`${title} - ${index + 1}`}
                            className="w-full h-full object-cover aspect-[3/2]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                
                {/* Dots indicateurs */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'bg-white w-2 h-2' 
                          : 'bg-white/50'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        carouselApi?.scrollTo(index);
                      }}
                      aria-label={`Aller à l'image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative h-full">
                <img 
                  src={images[0]} 
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            )}
            
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

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-primary" />
                  <span className="line-clamp-1">{location}</span>
                </div>
                {latitude && longitude && (
                  <span className="text-primary font-medium">
                    {getDistance(latitude, longitude)}
                  </span>
                )}
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
              
              <Button 
                size="sm" 
                className="bg-gradient-primary hover:opacity-90 px-4 py-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!canGiveFlame()) {
                    window.location.href = '/auth';
                  } else {
                    window.location.href = `/booking-form/${id}`;
                  }
                }}
              >
                <Calendar size={14} className="mr-1" />
                {price ? `${price} - Réserver` : 'Réserver'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}