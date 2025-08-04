import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { BottomNav } from "@/components/ui/bottom-nav";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock,
  Star,
  Heart,
  Calendar,
  Users,
  Edit3,
  Camera
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BusinessProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    opening_hours: "",
    avatar_url: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger le profil business
  const { data: profile, isLoading } = useQuery({
    queryKey: ["business-profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les statistiques business
  const { data: stats } = useQuery({
    queryKey: ["business-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");
      
      // Nombre d'offres actives
      const { count: activeOffers } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('business_user_id', user.id)
        .eq('status', 'active');

      // Nombre total de réservations
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('business_user_id', user.id);

      // Nombre total de flammes reçues
      const { data: offers } = await supabase
        .from('offers')
        .select('id')
        .eq('business_user_id', user.id);

      const offerIds = offers?.map(o => o.id) || [];
      const { count: totalFlames } = await supabase
        .from('flames')
        .select('*', { count: 'exact', head: true })
        .in('offer_id', offerIds);

      return {
        activeOffers: activeOffers || 0,
        totalBookings: totalBookings || 0,
        totalFlames: totalFlames || 0,
        rating: 4.8 // Static pour maintenant
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.first_name || "",
        description: profile.bio || "",
        address: profile.location || "",
        phone: (profile as any).phone || "",
        email: profile.email || "",
        website: (profile as any).website || "",
        opening_hours: (profile as any).opening_hours || "",
        avatar_url: profile.avatar_url || ""
      });
    }
  }, [profile]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.account_type !== "business") {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          first_name: data.company_name,
          bio: data.description,
          location: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          opening_hours: data.opening_hours,
          avatar_url: data.avatar_url,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      toast({
        title: "Profil mis à jour !",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      setIsEditing(false);
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (isLoading) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
            Profil Entreprise
          </h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            <Edit3 size={16} className="mr-2" />
            {isEditing ? "Annuler" : "Modifier"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Photo et infos principales */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {isEditing ? (
                <div className="flex flex-col items-center gap-2">
                  <ProfilePhotoUpload
                    currentAvatarUrl={profile?.avatar_url}
                    firstName={formData.company_name}
                    onPhotoUpdated={(newUrl) => {
                      setFormData(prev => ({ ...prev, avatar_url: newUrl }));
                      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
                    }}
                  />
                </div>
              ) : (
                <Avatar className="w-20 h-20 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url} alt={formData.company_name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">
                    {formData.company_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="company_name">Nom de l'entreprise</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-poppins font-bold text-foreground">
                      {formData.company_name || "Nom de l'entreprise"}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-warning fill-current" />
                        <span className="text-sm font-medium">{stats?.rating || 0}</span>
                      </div>
                      <Badge className="bg-gradient-primary text-primary-foreground">
                        Vérifié
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez votre entreprise..."
                  rows={3}
                />
              </div>
            ) : (
              formData.description && (
                <p className="text-muted-foreground mt-3">
                  {formData.description}
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Nos performances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-primary rounded-xl">
                <Calendar size={20} className="mx-auto mb-2 text-primary-foreground" />
                <div className="text-lg font-bold text-primary-foreground">{stats?.activeOffers || 0}</div>
                <div className="text-xs text-primary-foreground/80">Offres actives</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-success rounded-xl">
                <Users size={20} className="mx-auto mb-2 text-white" />
                <div className="text-lg font-bold text-white">{stats?.totalBookings || 0}</div>
                <div className="text-xs text-white/80">Réservations</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-flame rounded-xl">
                <Heart size={20} className="mx-auto mb-2 text-white" />
                <div className="text-lg font-bold text-white">{stats?.totalFlames || 0}</div>
                <div className="text-xs text-white/80">Flammes reçues</div>
              </div>
              
              <div className="text-center p-3 bg-gradient-secondary rounded-xl">
                <Star size={20} className="mx-auto mb-2 text-secondary-foreground" />
                <div className="text-lg font-bold text-secondary-foreground">{stats?.rating || 0}</div>
                <div className="text-xs text-secondary-foreground/80">Note moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de contact */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin size={16} />
                    Adresse exacte
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 rue de la République, 69002 Lyon"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone size={16} />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="04 00 00 00 00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@entreprise.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe size={16} />
                    Site web
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.entreprise.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="opening_hours" className="flex items-center gap-2">
                    <Clock size={16} />
                    Horaires d'ouverture
                  </Label>
                  <Textarea
                    id="opening_hours"
                    value={formData.opening_hours}
                    onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                    placeholder="Lun-Ven: 9h-18h&#10;Sam: 10h-16h&#10;Dim: Fermé"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                {formData.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-primary mt-1" />
                    <span className="text-sm text-foreground">{formData.address}</span>
                  </div>
                )}
                
                {formData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-primary" />
                    <span className="text-sm text-foreground">{formData.phone}</span>
                  </div>
                )}
                
                {formData.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-primary" />
                    <span className="text-sm text-foreground">{formData.email}</span>
                  </div>
                )}
                
                {formData.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-primary" />
                    <a 
                      href={formData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {formData.website}
                    </a>
                  </div>
                )}
                
                {formData.opening_hours && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-primary mt-1" />
                    <div className="text-sm text-foreground whitespace-pre-line">
                      {formData.opening_hours}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        {isEditing && (
          <Button 
            onClick={handleSave}
            className="w-full bg-gradient-primary"
            size="lg"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}