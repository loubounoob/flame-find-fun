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
  const [isLiked, setIsLiked] = useState(false);
  const [flames, setFlames] = useState(mockOffer.flames);
  const [showBusiness, setShowBusiness] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setFlames(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mockOffer.title,
        text: mockOffer.description,
        url: window.location.href,
      });
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
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share size={20} />
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {/* Media */}
        <div className="relative aspect-[16/10]">
          {mockOffer.video ? (
            <VideoPlayer 
              src={mockOffer.video}
              poster={mockOffer.image}
              className="w-full h-full"
            />
          ) : (
            <img 
              src={mockOffer.image} 
              alt={mockOffer.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Floating badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Badge variant="secondary" className="bg-secondary/90 backdrop-blur-sm">
              {mockOffer.category}
            </Badge>
            <Badge className="bg-gradient-flame text-white font-bold animate-pulse-glow">
              {mockOffer.discount}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Main Info */}
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground mb-2">
              {mockOffer.title}
            </h1>
            
            {/* Business info with click handler */}
            <button 
              onClick={() => setShowBusiness(!showBusiness)}
              className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={mockOffer.business_profile.logo} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {mockOffer.business.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{mockOffer.business}</span>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-warning fill-current" />
                <span className="text-sm text-muted-foreground">{mockOffer.rating} ({mockOffer.reviewCount})</span>
              </div>
            </button>

            <p className="text-muted-foreground leading-relaxed">
              {mockOffer.description}
            </p>
          </div>

          {/* Business Profile Modal/Card */}
          {showBusiness && (
            <Card className="bg-gradient-card border-border/50 animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mockOffer.business_profile.logo} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {mockOffer.business.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-poppins font-bold text-foreground">{mockOffer.business_profile.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-warning fill-current" />
                      <span className="text-sm text-muted-foreground">
                        {mockOffer.business_profile.rating} ({mockOffer.business_profile.reviewCount} avis)
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {mockOffer.business_profile.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-sm text-foreground">{mockOffer.business_profile.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-secondary" />
                    <span className="text-sm text-foreground">{mockOffer.business_profile.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-info" />
                    <span className="text-sm text-foreground">{mockOffer.business_profile.website}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Instagram size={16} className="text-destructive" />
                    <span className="text-sm text-foreground">{mockOffer.business_profile.instagram}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Horaires d'ouverture</h4>
                  {Object.entries(mockOffer.business_profile.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
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
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <span className="text-foreground">{mockOffer.location}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-secondary" />
                  <span className="text-foreground">{mockOffer.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-secondary" />
                  <span className="text-foreground">{mockOffer.timeSlot}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users size={18} className="text-info" />
                <span className="text-foreground">{mockOffer.capacity}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleLike}
              className={`flex-1 ${isLiked ? 'bg-flame/10 border-flame text-flame' : ''}`}
            >
              <Heart 
                size={18} 
                className={`mr-2 ${isLiked ? 'fill-current' : ''}`} 
              />
              {flames} Flammes
            </Button>
            
            <Link to={`/booking/${id}`} className="flex-1">
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Réserver maintenant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}