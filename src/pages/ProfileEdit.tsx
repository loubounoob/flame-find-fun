import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function ProfileEdit() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    location: "",
    university: "",
    studyLevel: "",
    birthDate: "",
    avatar: ""
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      
      // Load existing profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileData) {
        setProfile({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email || session.user.email || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          university: profileData.university || "",
          studyLevel: profileData.study_level || "",
          birthDate: profileData.birth_date || "",
          avatar: profileData.avatar_url || ""
        });
      } else {
        // Create profile if it doesn't exist
        setProfile(prev => ({ ...prev, email: session.user.email || "" }));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    console.log("Saving profile:", profile);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          bio: profile.bio,
          location: profile.location,
          university: profile.university,
          study_level: profile.studyLevel,
          birth_date: profile.birthDate || null,
          avatar_url: profile.avatar
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profil sauvegardé",
        description: "Tes modifications ont été enregistrées avec succès!",
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil. Réessaye plus tard.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-poppins font-bold text-foreground">
            Modifier le profil
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Avatar Section */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={profile.avatar} alt={profile.firstName} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 rounded-full bg-gradient-primary border-2 border-background"
              >
                <Camera size={16} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Touche l'icône pour changer ta photo
            </p>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile({...profile, birthDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Raconte-nous qui tu es..."
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Studies Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Études</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">Université</Label>
              <Select value={profile.university} onValueChange={(value) => setProfile({...profile, university: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionne ton université" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Université Claude Bernard Lyon 1">Université Claude Bernard Lyon 1</SelectItem>
                  <SelectItem value="Université Lumière Lyon 2">Université Lumière Lyon 2</SelectItem>
                  <SelectItem value="Université Jean Moulin Lyon 3">Université Jean Moulin Lyon 3</SelectItem>
                  <SelectItem value="INSA Lyon">INSA Lyon</SelectItem>
                  <SelectItem value="École Centrale de Lyon">École Centrale de Lyon</SelectItem>
                  <SelectItem value="EM Lyon">EM Lyon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyLevel">Niveau d'études</Label>
              <Select value={profile.studyLevel} onValueChange={(value) => setProfile({...profile, studyLevel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionne ton niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">Licence 1</SelectItem>
                  <SelectItem value="L2">Licence 2</SelectItem>
                  <SelectItem value="L3">Licence 3</SelectItem>
                  <SelectItem value="M1">Master 1</SelectItem>
                  <SelectItem value="M2">Master 2</SelectItem>
                  <SelectItem value="Doctorat">Doctorat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ville</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({...profile, location: e.target.value})}
                placeholder="Lyon, France"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          <Save className="mr-2" size={20} />
          {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}