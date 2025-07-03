import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  GraduationCap,
  Building2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Label } from "@/components/ui/label";

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    birthDate: "",
    location: "",
    university: "",
    studyLevel: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        birthDate: profile.birth_date || "",
        location: profile.location || "",
        university: profile.university || "",
        studyLevel: profile.study_level || ""
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          bio: data.bio,
          birth_date: data.birthDate,
          location: data.location,
          university: data.university,
          study_level: data.studyLevel,
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profil mis à jour !",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      navigate("/profile");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
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
        {/* Profile Photo */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Photo de profil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload
              currentAvatarUrl={profile?.avatar_url}
              firstName={formData.firstName}
              lastName={formData.lastName}
              onPhotoUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ["profile"] });
              }}
            />
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User size={20} className="text-primary" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom de famille</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Nom de famille"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar size={16} />
                Date de naissance
              </Label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Parlez-nous de vous..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Info */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap size={20} className="text-secondary" />
              Informations académiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university" className="flex items-center gap-2">
                <Building2 size={16} />
                Université
              </Label>
              <Input
                value={formData.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
                placeholder="Nom de votre établissement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyLevel">Niveau d'études</Label>
              <Select value={formData.studyLevel} onValueChange={(value) => handleInputChange('studyLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner votre niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Licence 1">Licence 1</SelectItem>
                  <SelectItem value="Licence 2">Licence 2</SelectItem>
                  <SelectItem value="Licence 3">Licence 3</SelectItem>
                  <SelectItem value="Master 1">Master 1</SelectItem>
                  <SelectItem value="Master 2">Master 2</SelectItem>
                  <SelectItem value="Doctorat">Doctorat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin size={16} />
                Localisation
              </Label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ville, Pays"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave}
          className="w-full bg-gradient-primary"
          size="lg"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}