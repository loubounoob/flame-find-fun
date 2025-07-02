import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Trophy, Zap, Star, TrendingUp, Award } from "lucide-react";
import { Link } from "react-router-dom";

const stats = {
  totalFlames: 247,
  flamesToday: 12,
  weeklyGoal: 50,
  weeklyProgress: 32,
  rank: 156,
  totalUsers: 2847
};

const likedOffers = [
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
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <h1 className="text-2xl font-poppins font-bold text-gradient-flame">
          Mes Flammes 🔥
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ton activité et tes découvertes
        </p>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <section>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="bg-gradient-flame text-white border-0">
              <CardContent className="p-4 text-center">
                <Zap size={24} className="mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.flamesToday}</div>
                <div className="text-xs opacity-90">Aujourd'hui</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-primary text-primary-foreground border-0">
              <CardContent className="p-4 text-center">
                <Trophy size={24} className="mx-auto mb-2" />
                <div className="text-2xl font-bold">#{stats.rank}</div>
                <div className="text-xs opacity-90">Classement</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-success" />
                Objectif hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{stats.weeklyProgress}/{stats.weeklyGoal}</span>
                </div>
                <Progress 
                  value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Plus que {stats.weeklyGoal - stats.weeklyProgress} flammes pour atteindre ton objectif !
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="text-lg font-poppins font-semibold mb-3">Accomplissements</h2>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <Card key={index} className="bg-gradient-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.progress && (
                        <div className="mt-2">
                          <Progress 
                            value={(achievement.progress / achievement.target!) * 100} 
                            className="h-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.progress}/{achievement.target}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={achievement.completed ? "default" : "secondary"}
                        className={achievement.completed ? "bg-success" : ""}
                      >
                        +{achievement.points}
                      </Badge>
                      {achievement.completed && (
                        <Award size={20} className="text-success" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Liked Offers */}
        <section>
          <h2 className="text-lg font-poppins font-semibold mb-3">Mes offres flammées</h2>
          {likedOffers.length > 0 ? (
            <div className="space-y-3">
              {likedOffers.map((offer) => (
                <Link key={offer.id} to={`/offer/${offer.id}`}>
                  <Card className="bg-gradient-card border-border/50 hover-lift hover-glow">
                    <CardContent className="p-0">
                      <div className="flex">
                        <img 
                          src={offer.image} 
                          alt={offer.title}
                          className="w-20 h-20 object-cover rounded-l-xl"
                        />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{offer.title}</h3>
                              <p className="text-sm text-muted-foreground">{offer.business}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Flammé {offer.myFlameDate}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart size={14} className="text-flame fill-current" />
                              <span className="text-sm font-medium">{offer.flames}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-8 text-center">
                <Heart size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground mb-2">Aucune flamme donnée</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commence à explorer et donne des flammes aux offres qui t'intéressent !
                </p>
                <Link to="/explore">
                  <Button variant="default">
                    Explorer les offres
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}