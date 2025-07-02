import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function ProfileEdit() {
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Dubois",
    email: "alex.dubois@etudiant.univ-lyon1.fr",
    bio: "Étudiant en informatique passionné d'activités ludiques !",
    location: "Lyon, France",
    university: "Université Claude Bernard Lyon 1",
    studyLevel: "Master 1",
    birthDate: "2001-05-15",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  });

  const handleSave = () => {
    console.log("Saving profile:", profile);
    // Here you would save to Supabase
  };

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
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          <Save className="mr-2" size={20} />
          Sauvegarder les modifications
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}