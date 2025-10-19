import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  HelpCircle, 
  Star, 
  Download,
  Trash2,
  Eye,
  MapPin,
  Smartphone,
  Volume2,
  Vibrate,
  Edit,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has a preference saved or default to true (dark mode)
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [language, setLanguage] = useState("fr");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [dataUsage, setDataUsage] = useState("wifi");
  const [user, setUser] = useState(null);
  const [previousRoute, setPreviousRoute] = useState("/");
  const { toast } = useToast();

  useEffect(() => {
    // Apply theme class to document and save preference
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [darkMode]);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Set default route based on user type if no saved route
      const savedRoute = sessionStorage.getItem('previousRoute');
      if (savedRoute) {
        setPreviousRoute(savedRoute);
      } else if (session?.user?.user_metadata?.account_type === "business") {
        setPreviousRoute("/business-dashboard");
      } else {
        setPreviousRoute("/");
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExportData = () => {
    toast({
      title: "Export démarré",
      description: "Tes données seront envoyées par email sous 24h.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Suppression de compte",
      description: "Un email de confirmation a été envoyé.",
      variant: "destructive"
    });
  };

  const handleClearCache = () => {
    toast({
      title: "Cache vidé",
      description: "Le cache de l'application a été supprimé.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Link 
            to={previousRoute}
          >
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-poppins font-bold text-foreground">
            Paramètres
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Section - Only if logged in and not business account */}
        {user && user.user_metadata?.account_type !== "business" && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={20} />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/profile/edit">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-3" size={16} />
                  Modifier mon profil
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Appearance */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye size={20} />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-warning" />}
                <div>
                  <h4 className="font-medium text-foreground">Mode sombre</h4>
                  <p className="text-sm text-muted-foreground">Interface adaptée pour la nuit</p>
                </div>
              </div>
              <Switch 
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-info" />
                <div>
                  <h4 className="font-medium text-foreground">Langue</h4>
                  <p className="text-sm text-muted-foreground">Français</p>
                </div>
              </div>
              <Badge variant="outline">FR</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield size={20} />
              Confidentialité et sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-success" />
                <div>
                  <h4 className="font-medium text-foreground">Géolocalisation</h4>
                  <p className="text-sm text-muted-foreground">Pour trouver les offres près de toi</p>
                </div>
              </div>
              <Switch 
                checked={locationEnabled}
                onCheckedChange={setLocationEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Profil visible</h4>
                <p className="text-sm text-muted-foreground">Les autres utilisateurs peuvent voir ton profil</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Button variant="outline" className="w-full" onClick={handleExportData}>
              <Download className="mr-2" size={16} />
              Exporter mes données
            </Button>
          </CardContent>
        </Card>

        {/* Performance & Data */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone size={20} />
              Performance et données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={20} className="text-secondary" />
                <div>
                  <h4 className="font-medium text-foreground">Sons</h4>
                  <p className="text-sm text-muted-foreground">Sons de l'interface</p>
                </div>
              </div>
              <Switch 
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate size={20} className="text-primary" />
                <div>
                  <h4 className="font-medium text-foreground">Vibrations</h4>
                  <p className="text-sm text-muted-foreground">Retour haptique</p>
                </div>
              </div>
              <Switch 
                checked={hapticFeedback}
                onCheckedChange={setHapticFeedback}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Lecture automatique des vidéos</h4>
                <p className="text-sm text-muted-foreground">En Wi-Fi uniquement</p>
              </div>
              <Switch 
                checked={autoPlay}
                onCheckedChange={setAutoPlay}
              />
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Utilisation des données</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={dataUsage === "wifi" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDataUsage("wifi")}
                >
                  Wi-Fi uniquement
                </Button>
                <Button 
                  variant={dataUsage === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDataUsage("all")}
                >
                  Wi-Fi + Mobile
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClearCache}>
              Vider le cache (127 MB)
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle size={20} />
              Support et aide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="mr-3" size={16} />
              Centre d'aide
            </Button>
            
            <Button variant="ghost" className="w-full justify-start">
              <Star className="mr-3" size={16} />
              Noter l'application
            </Button>
            
            <div className="pt-2 border-t border-border/50">
              <div className="text-center text-sm text-muted-foreground">
                <p>Ludigo v2.1.0</p>
                <p className="mt-1">Développé avec 🔥</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {user && (
          <Card className="bg-gradient-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <Trash2 size={20} />
                Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2" size={16} />
                Supprimer mon compte
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Cette action est irréversible
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {user?.user_metadata?.account_type !== "business" && <BottomNav />}
    </div>
  );
}