import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Clock, Star, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Bowling", count: 12, icon: "🎳" },
  { name: "Laser Game", count: 8, icon: "🔫" },
  { name: "Karaoké", count: 15, icon: "🎤" },
  { name: "Escape Game", count: 6, icon: "🔐" },
  { name: "Billard", count: 9, icon: "🎱" },
  { name: "Cinéma", count: 20, icon: "🎬" },
];

const trendingOffers = [
  {
    id: "trending-1",
    title: "Happy Hour Bowling",
    business: "Strike Zone",
    location: "Lyon Centre",
    discount: "50% de réduction",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=400&h=300&fit=crop"
  },
  {
    id: "trending-2",
    title: "Laser Tag Tournament",
    business: "Galaxy Arena",
    location: "Part-Dieu",
    discount: "Gratuit pour 5 personnes",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop"
  },
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <h1 className="text-2xl font-poppins font-bold text-gradient-primary mb-4">
          Explorer
        </h1>
        
        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Chercher une activité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 rounded-xl border-2 border-border/50 focus:border-primary"
          />
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Filter size={20} />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Categories */}
        <section>
          <h2 className="text-lg font-poppins font-semibold mb-3">Catégories</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 border-border/50",
                  selectedCategory === category.name ? "bg-gradient-primary" : "bg-gradient-card hover-glow"
                )}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className={cn(
                    "font-semibold",
                    selectedCategory === category.name ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {category.name}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    selectedCategory === category.name ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {category.count} offres
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <h2 className="text-lg font-poppins font-semibold mb-3">Tendances 🔥</h2>
          <div className="space-y-3">
            {trendingOffers.map((offer) => (
              <Link key={offer.id} to={`/offer/${offer.id}`}>
                <Card className="bg-gradient-card border-border/50 hover-lift hover-glow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <img 
                        src={offer.image} 
                        alt={offer.title}
                        className="w-24 h-24 object-cover rounded-l-xl"
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{offer.title}</h3>
                            <p className="text-sm text-muted-foreground">{offer.business}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-warning fill-current" />
                            <span className="text-sm font-medium">{offer.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={14} className="text-primary" />
                          <span className="text-sm text-muted-foreground">{offer.location}</span>
                        </div>
                        <Badge className="bg-gradient-flame text-white">
                          {offer.discount}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-poppins font-semibold mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/map">
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <MapPin size={20} />
                <span>Voir la carte</span>
              </Button>
            </Link>
            <Link to="/flames">
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <span className="text-lg">🔥</span>
                <span>Mes flammes</span>
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}