import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Clock, Star, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-gradient-primary mb-4">
            Explorer
          </h1>
          
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground lg:w-6 lg:h-6" />
            <Input
              placeholder="Chercher une activité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 lg:h-14 rounded-xl border-2 border-border/50 focus:border-primary lg:text-lg"
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 lg:w-12 lg:h-12">
              <Filter size={20} className="lg:w-6 lg:h-6" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Categories */}
        <section>
          <h2 className="text-lg lg:text-xl font-poppins font-semibold mb-3 lg:mb-6">Catégories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 border-border/50",
                  selectedCategory === category.name ? "bg-gradient-primary" : "bg-gradient-card hover-glow"
                )}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              >
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="text-2xl lg:text-3xl mb-2">{category.icon}</div>
                  <h3 className={cn(
                    "font-semibold text-sm lg:text-base",
                    selectedCategory === category.name ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {category.name}
                  </h3>
                  <p className={cn(
                    "text-xs lg:text-sm",
                    selectedCategory === category.name ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {category.count} offres
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Offers */}
        <section>
          <h2 className="text-lg lg:text-xl font-poppins font-semibold mb-3 lg:mb-6">Tendances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {trendingOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-card border-border/50 hover-lift overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <Badge 
                    className="absolute top-3 right-3 bg-gradient-flame text-white font-bold lg:text-sm"
                  >
                    {offer.discount}
                  </Badge>
                </div>
                
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-2 lg:space-y-3">
                    <div>
                      <h3 className="font-semibold text-base lg:text-lg text-foreground line-clamp-1">
                        {offer.title}
                      </h3>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        {offer.business}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                        <MapPin size={12} className="text-primary lg:w-4 lg:h-4" />
                        <span className="line-clamp-1">{offer.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-current lg:w-4 lg:h-4" />
                        <span className="text-xs lg:text-sm font-semibold">{offer.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}