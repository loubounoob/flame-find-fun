import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Trophy, Zap, Star, TrendingUp, Award, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const stats = {
  totalFlames: 247,
  flamesToday: 12,
  weeklyGoal: 50,
  weeklyProgress: 32,
  rank: 156,
  totalUsers: 2847
};

const initialLikedOffers = [
  {
    id: "liked-1",
    title: "Bowling Party 🎳",
    business: "Strike Zone",
    flames: 247,
    myFlameDate: "Il y a 2h",
    image: "https://images.unsplash.com/photo-1586985564150-0fb8542ab05e?w=400&h=300&fit=crop"
  },
  {
    id: "liked-2",
    title: "Laser Game Epic 🔫",
    business: "Galaxy Arena",
    flames: 189,
    myFlameDate: "Hier",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop"
  }
];

const achievements = [
  { 
    title: "Premier feu 🔥", 
    description: "Donne ta première flamme",
    completed: true,
    points: 10
  },
  { 
    title: "Explorateur 🗺️", 
    description: "Visite 5 offres différentes",
    completed: true,
    points: 25
  },
  { 
    title: "Passionné 💪", 
    description: "Donne 50 flammes",
    completed: false,
    progress: 32,
    target: 50,
    points: 50
  }
];

export default function Flames() {
  const [likedOffers, setLikedOffers] = useState(initialLikedOffers);
  const { toast } = useToast();

  const removeFlame = (offerId: string) => {
    setLikedOffers(prev => prev.filter(offer => offer.id !== offerId));
    toast({
      title: "Flamme retirée",
      description: "Tu as retiré ta flamme de cette offre.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-gradient-flame">
            Mes Flammes 🔥
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">
            Ton activité et tes découvertes
          </p>
        </div>
      </header>

      <div className="p-4 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Stats Overview */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <Card className="bg-gradient-flame text-white border-0">
              <CardContent className="p-4 lg:p-6 text-center">
                <Zap size={24} className="mx-auto mb-2 lg:w-8 lg:h-8" />
                <div className="text-2xl lg:text-3xl font-bold">{stats.flamesToday}</div>
                <div className="text-xs lg:text-sm opacity-90">Aujourd'hui</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-primary text-primary-foreground border-0">
              <CardContent className="p-4 lg:p-6 text-center">
                <Trophy size={24} className="mx-auto mb-2 lg:w-8 lg:h-8" />
                <div className="text-2xl lg:text-3xl font-bold">{stats.totalFlames}</div>
                <div className="text-xs lg:text-sm opacity-90">Total</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-secondary text-secondary-foreground border-0">
              <CardContent className="p-4 lg:p-6 text-center">
                <TrendingUp size={24} className="mx-auto mb-2 lg:w-8 lg:h-8" />
                <div className="text-2xl lg:text-3xl font-bold">#{stats.rank}</div>
                <div className="text-xs lg:text-sm opacity-90">Classement</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4 lg:p-6 text-center">
                <Award size={24} className="mx-auto mb-2 lg:w-8 lg:h-8 text-warning" />
                <div className="text-2xl lg:text-3xl font-bold">{stats.weeklyProgress}/{stats.weeklyGoal}</div>
                <div className="text-xs lg:text-sm text-muted-foreground">Objectif hebdo</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Weekly Progress */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="font-semibold text-foreground lg:text-lg">Progression hebdomadaire</h3>
                <span className="text-sm lg:text-base text-muted-foreground">
                  {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
                </span>
              </div>
              <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} className="h-2 lg:h-3" />
            </CardContent>
          </Card>
        </section>

        {/* Liked Offers */}
        <section>
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-poppins font-semibold">Mes offres likées</h2>
            <Badge variant="secondary" className="lg:text-sm">
              {likedOffers.length} offres
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {likedOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-card border-border/50 hover-lift overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-3 right-3 bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1 lg:px-3 lg:py-1.5 lg:text-sm">
                    <Heart size={12} className="fill-current lg:w-4 lg:h-4" />
                    {offer.flames}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white lg:w-10 lg:h-10"
                    onClick={() => removeFlame(offer.id)}
                  >
                    <Minus size={16} className="lg:w-5 lg:h-5" />
                  </Button>
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
                      <span className="text-xs lg:text-sm text-muted-foreground">
                        {offer.myFlameDate}
                      </span>
                      <Link to={`/offer/${offer.id}`}>
                        <Button size="sm" variant="outline" className="lg:text-sm">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="text-lg lg:text-xl font-poppins font-semibold mb-4 lg:mb-6">Succès</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="bg-gradient-card border-border/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-2xl lg:text-3xl ${
                      achievement.completed 
                        ? 'bg-gradient-flame text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {achievement.completed ? '🏆' : '🎯'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground lg:text-lg mb-1 lg:mb-2">
                        {achievement.title}
                      </h3>
                      <p className="text-sm lg:text-base text-muted-foreground mb-2 lg:mb-3">
                        {achievement.description}
                      </p>
                      
                      {achievement.completed ? (
                        <Badge className="bg-gradient-flame text-white lg:text-sm">
                          +{achievement.points} points
                        </Badge>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs lg:text-sm">
                            <span className="text-muted-foreground">Progression</span>
                            <span className="text-foreground">
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.target) * 100} 
                            className="h-2 lg:h-3" 
                          />
                        </div>
                      )}
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