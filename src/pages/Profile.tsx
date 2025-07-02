import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  Trophy, 
  Settings, 
  CreditCard, 
  Bell, 
  LogOut,
  Edit3
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const userProfile = {
  name: "Alex Dubois",
  email: "alex.dubois@etudiant.univ-lyon1.fr",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  location: "Lyon, France",
  joinDate: "Septembre 2024",
  subscription: "Premium Étudiant",
  stats: {
    flamesToday: 12,
    totalFlames: 247,
    offersBooked: 18,
    rating: 4.8
  }
};

const menuItems = [
  { icon: Edit3, label: "Modifier le profil", href: "/profile/edit" },
  { icon: CreditCard, label: "Abonnement", href: "/subscription" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

export default function Profile() {
  const [isSubscribed, setIsSubscribed] = useState(true);

  const handleLogout = () => {
    // Logique de déconnexion
    console.log("Logout");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
          Profil
        </h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-bold">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-poppins font-bold text-foreground">
                  {userProfile.name}
                </h2>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-sm text-muted-foreground">{userProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-secondary" />
                    <span className="text-sm text-muted-foreground">Depuis {userProfile.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="flex items-center justify-between p-3 bg-gradient-primary rounded-xl">
              <div>
                <p className="text-primary-foreground font-semibold">{userProfile.subscription}</p>
                <p className="text-primary-foreground/80 text-sm">Accès illimité aux offres</p>
              </div>
              <Badge className="bg-white/20 text-primary-foreground border-0">
                Actif
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Mes statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-flame rounded-xl">
                <Heart size={20} className="mx-auto mb-2 text-white" />
                <div className="text-lg font-bold text-white">{userProfile.stats.flamesToday}</div>
                <div className="text-xs text-white/80">Aujourd'hui</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-secondary rounded-xl">
                <Trophy size={20} className="mx-auto mb-2 text-secondary-foreground" />
                <div className="text-lg font-bold text-secondary-foreground">{userProfile.stats.totalFlames}</div>
                <div className="text-xs text-secondary-foreground/80">Total flammes</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-primary rounded-xl">
                <Calendar size={20} className="mx-auto mb-2 text-primary-foreground" />
                <div className="text-lg font-bold text-primary-foreground">{userProfile.stats.offersBooked}</div>
                <div className="text-xs text-primary-foreground/80">Réservations</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-card border border-border/50 rounded-xl">
                <Star size={20} className="mx-auto mb-2 text-warning" />
                <div className="text-lg font-bold text-foreground">{userProfile.stats.rating}</div>
                <div className="text-xs text-muted-foreground">Note moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Options */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <Link to={item.href}>
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <item.icon size={20} className="text-muted-foreground" />
                    <span className="flex-1 text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">›</span>
                  </div>
                </Link>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>

        {/* Version info */}
        <div className="text-center text-xs text-muted-foreground">
          FlameUp v1.0.0 • Made with 🔥 for students
        </div>
      </div>
    </div>
  );
}