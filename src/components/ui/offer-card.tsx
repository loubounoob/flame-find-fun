import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import { Heart, MapPin, Clock, Calendar, Star } from "lucide-react";
import { useState } from "react";

interface OfferCardProps {
  id: string;
  title: string;
  business: string;
  description: string;
  location: string;
  timeSlot: string;
  date: string;
  discount: string;
  category: string;
  image: string;
  flames: number;
  isLiked?: boolean;
  onLike?: (id: string) => void;
  onBook?: (id: string) => void;
  className?: string;
}

export function OfferCard({
  id,
  title,
  business,
  description,
  location,
  timeSlot,
  date,
  discount,
  category,
  image,
  flames,
  isLiked = false,
  onLike,
  onBook,
  className
}: OfferCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [currentFlames, setCurrentFlames] = useState(flames);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setCurrentFlames(prev => prev + 1);
      onLike?.(id);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-card",
        "border border-border/50 shadow-lg",
        "hover-lift hover-glow",
        "animate-fade-in",
        className
      )}
    >
      {/* Image with overlay */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-sm"
        >
          {category}
        </Badge>
        
        {/* Discount badge */}
        <Badge 
          className="absolute top-3 right-3 bg-gradient-flame text-white font-bold animate-pulse-glow"
        >
          {discount}
        </Badge>

        {/* Flames counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <Heart 
            size={14} 
            className={cn(
              "transition-colors duration-300",
              liked ? "fill-flame text-flame" : "text-white"
            )} 
          />
          <span className="text-white text-sm font-medium">{currentFlames}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Title and business */}
          <div>
            <h3 className="font-poppins font-semibold text-lg text-foreground line-clamp-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {business}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span className="line-clamp-1">{location}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar size={14} className="text-secondary" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock size={14} className="text-secondary" />
                <span>{timeSlot}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              disabled={liked}
              className={cn(
                "flex-1 transition-all duration-300",
                liked 
                  ? "bg-flame/10 border-flame text-flame" 
                  : "hover:bg-flame/10 hover:border-flame hover:text-flame"
              )}
            >
              <Heart 
                size={16} 
                className={cn(
                  "mr-2 transition-all duration-300",
                  liked && "fill-current"
                )} 
              />
              {liked ? "Flammé!" : "Flamme"}
            </Button>
            
            <Button
              size="sm"
              onClick={() => onBook?.(id)}
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity duration-300"
            >
              Réserver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}