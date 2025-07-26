import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User as UserIcon, 
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
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

// Function to calculate real user statistics
const calculateUserStats = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's flame
    const { data: todayFlame } = await supabase
      .from('user_flames_daily')
      .select('offer_id')
      .eq('user_id', userId)
      .eq('flame_date', today)
      .single();
    
    // Get total flames given (count of days with flames)
    const { count: totalFlames } = await supabase
      .from('user_flames_daily')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('offer_id', 'is', null);
    
    // Get bookings count
    const { count: offersBooked } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    return {
      flamesToday: todayFlame?.offer_id ? 1 : 0,
      totalFlames: totalFlames || 0,
      offersBooked: offersBooked || 0,
      rating: 4.8 // Static for now
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      flamesToday: 0,
      totalFlames: 0,
      offersBooked: 0,
      rating: 0
    };
  }
};

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  location: string;
  joinDate: string;
  subscription: string;
  stats: {
    flamesToday: number;
    totalFlames: number;
    offersBooked: number;
    rating: number;
  };
}

const menuItems = [
  { icon: Edit3, label: "Modifier le profil", href: "/profile/edit" },
  { icon: CreditCard, label: "Abonnement", href: "/subscription" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      
      // Load profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileData) {
        const userStats = await calculateUserStats(session.user.id);
        setUserProfile({
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          email: profileData.email || session.user.email || '',
          avatar: profileData.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          location: profileData.location || "Lyon, France",
          joinDate: new Date(profileData.created_at).toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
          }),
          subscription: "Premium Étudiant",
          stats: userStats
        });
      } else {
        // Default profile if no data exists
        setUserProfile({
          name: session.user.email?.split('@')[0] || 'Utilisateur',
          email: session.user.email || '',
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          location: "Lyon, France",
          joinDate: new Date().toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
          }),
          subscription: "Premium Étudiant",
          stats: {
            flamesToday: 0,
            totalFlames: 0,
            offersBooked: 0,
            rating: 0
          }
        });
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur FlameUp!",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-gradient-primary">
            Profil
          </h1>
        </div>
      </header>

      <div className="p-4 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Profile Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-4 lg:gap-6 mb-4 lg:mb-6">
              <Avatar className="w-16 h-16 lg:w-20 lg:h-20 border-2 border-primary">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg lg:text-xl font-bold">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl lg:text-2xl font-poppins font-bold text-foreground">
                  {userProfile.name}
                </h2>
                <p className="text-sm lg:text-base text-muted-foreground">{userProfile.email}</p>
                <div className="flex items-center gap-4 mt-2 lg:mt-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-primary lg:w-4 lg:h-4" />
                    <span className="text-sm lg:text-base text-muted-foreground">{userProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-secondary lg:w-4 lg:h-4" />
                    <span className="text-sm lg:text-base text-muted-foreground">Depuis {userProfile.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-primary rounded-xl">
              <div>
                <p className="text-primary-foreground font-semibold lg:text-lg">{userProfile.subscription}</p>
                <p className="text-primary-foreground/80 text-sm lg:text-base">Accès illimité aux offres</p>
              </div>
              <Badge className="bg-white/20 text-primary-foreground border-0 lg:text-sm lg:px-3 lg:py-1">
                Actif
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="lg:px-8 lg:py-6">
            <CardTitle className="text-lg lg:text-xl">Mes statistiques</CardTitle>
          </CardHeader>
          <CardContent className="lg:px-8 lg:pb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="text-center p-3 lg:p-4 bg-gradient-flame rounded-xl">
                <Heart size={20} className="mx-auto mb-2 text-white lg:w-6 lg:h-6" />
                <div className="text-lg lg:text-xl font-bold text-white">{userProfile.stats.flamesToday}</div>
                <div className="text-xs lg:text-sm text-white/80">Aujourd'hui</div>
              </div>
              
              <div className="text-center p-3 lg:p-4 bg-gradient-secondary rounded-xl">
                <Trophy size={20} className="mx-auto mb-2 text-secondary-foreground lg:w-6 lg:h-6" />
                <div className="text-lg lg:text-xl font-bold text-secondary-foreground">{userProfile.stats.totalFlames}</div>
                <div className="text-xs lg:text-sm text-secondary-foreground/80">Total flammes</div>
              </div>
              
              <div className="text-center p-3 lg:p-4 bg-gradient-primary rounded-xl">
                <Calendar size={20} className="mx-auto mb-2 text-primary-foreground lg:w-6 lg:h-6" />
                <div className="text-lg lg:text-xl font-bold text-primary-foreground">{userProfile.stats.offersBooked}</div>
                <div className="text-xs lg:text-sm text-primary-foreground/80">Réservations</div>
              </div>
              
              <div className="text-center p-3 lg:p-4 bg-gradient-card border border-border/50 rounded-xl">
                <Star size={20} className="mx-auto mb-2 text-warning lg:w-6 lg:h-6" />
                <div className="text-lg lg:text-xl font-bold text-foreground">{userProfile.stats.rating}</div>
                <div className="text-xs lg:text-sm text-muted-foreground">Note moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Options */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="lg:px-8 lg:py-6">
            <CardTitle className="text-lg lg:text-xl">Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="p-0 lg:px-8 lg:pb-8">
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <Link to={item.href}>
                  <div className="flex items-center gap-3 p-4 lg:p-5 hover:bg-muted/20 transition-colors">
                    <item.icon size={20} className="text-muted-foreground lg:w-5 lg:h-5" />
                    <span className="flex-1 text-foreground lg:text-lg">{item.label}</span>
                    <span className="text-muted-foreground lg:text-lg">›</span>
                  </div>
                </Link>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 lg:p-8">
            <Button 
              variant="destructive" 
              className="w-full lg:h-12 lg:text-lg" 
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-2 lg:w-5 lg:h-5" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>

        {/* Version info */}
        <div className="text-center text-xs lg:text-sm text-muted-foreground">
          FlameUp v1.0.0 • Made with 🔥 for students
        </div>
      </div>
    </div>
  );
}