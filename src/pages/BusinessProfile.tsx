import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  LogOut,
  Edit,
  Flame,
  Calendar,
  BarChart3,
  Eye,
  MapPin,
  Phone,
  Globe,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { MediaUpload } from "@/components/MediaUpload";
import { BusinessPricing } from "@/components/BusinessPricing";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function BusinessProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    activeOffers: 0,
    totalBookings: 0,
    totalFlames: 0,
    averageRating: 0
  });
  const [formData, setFormData] = useState({
    company_name: "",
    bio: "",
    phone: "",
    website: "",
    location: "",
    opening_hours: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  // Écouter les nouvelles notifications pour recharger les stats en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('rating-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new?.type === 'new_rating') {
            loadStats(); // Recharger les stats quand une nouvelle note arrive
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.account_type !== "business") {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadProfile();
    loadStats();
  };

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (profileData) {
        setProfile(profileData);
        setFormData({
          company_name: session.user.user_metadata?.company_name || "",
          bio: profileData.bio || "",
          phone: profileData.phone || "",
          website: profileData.website || "",
          location: profileData.location || "",
          opening_hours: profileData.opening_hours || ""
        });
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
            email: session.user.email
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Load offers
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('id')
        .eq('business_user_id', session.user.id)
        .eq('status', 'active');

      if (offersError) throw offersError;

      // Load bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('business_user_id', session.user.id);

      if (bookingsError) throw bookingsError;

      // Load flames
      const { data: flames, error: flamesError } = await supabase
        .from('flames')
        .select('id')
        .in('offer_id', offers?.map(o => o.id) || []);

      if (flamesError) throw flamesError;

      // Load average rating - calcul en temps réel
      let averageRating = 0;
      if (offers && offers.length > 0) {
        const { data: ratings, error: ratingsError } = await supabase
          .from('offer_ratings')
          .select('rating')
          .in('offer_id', offers.map(o => o.id));

        if (!ratingsError && ratings && ratings.length > 0) {
          const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
          averageRating = totalRating / ratings.length;
        }
      }

      setStats({
        activeOffers: offers?.length || 0,
        totalBookings: bookings?.length || 0,
        totalFlames: flames?.length || 0,
        averageRating: averageRating
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          phone: formData.phone,
          website: formData.website,
          location: formData.location,
          opening_hours: formData.opening_hours
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update user metadata for company name
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          company_name: formData.company_name
        }
      });

      if (authError) throw authError;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès !",
      });

      setIsEditing(false);
      loadProfile();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user || !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground">
              Profil Entreprise
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
              <Settings size={20} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <ProfilePhotoUpload
                currentAvatarUrl={profile.avatar_url}
                firstName={user.user_metadata?.first_name}
                lastName={user.user_metadata?.last_name}
                onPhotoUpdated={loadProfile}
              />
              
              <div className="space-y-2">
                {isEditing ? (
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className="text-center text-xl font-bold"
                  />
                ) : (
                  <h2 className="text-xl font-bold">
                    {user.user_metadata?.company_name || "Nom de l'entreprise"}
                  </h2>
                )}
                
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Décrivez votre entreprise..."
                    rows={3}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {profile.bio || "Aucune description disponible"}
                  </p>
                )}
              </div>

              <Button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                variant={isEditing ? "default" : "outline"}
              >
                <Edit className="mr-2" size={16} />
                {isEditing ? "Sauvegarder" : "Modifier le profil"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Total Flammes</p>
                  <p className="text-xl font-bold">{stats.totalFlames}</p>
                </div>
                <Flame size={20} className="fill-current" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-success text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Réservations</p>
                  <p className="text-xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar size={20} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-info text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Offres Actives</p>
                  <p className="text-xl font-bold">{stats.activeOffers}</p>
                </div>
                <BarChart3 size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Note Moyenne</p>
                  <p className="text-xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Eye size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone size={20} />
              Informations de contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              ) : (
                <p className="text-muted-foreground">{profile.phone || "Non renseigné"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://monentreprise.com"
                />
              ) : (
                <p className="text-muted-foreground">{profile.website || "Non renseigné"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Adresse</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="123 rue de la République, 69002 Lyon"
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile.address || profile.location || "Non renseigné"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_hours">Horaires d'ouverture</Label>
              {isEditing ? (
                <Textarea
                  id="opening_hours"
                  value={formData.opening_hours}
                  onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                  placeholder="Lun-Ven: 9h-18h, Sam: 10h-16h"
                  rows={2}
                />
              ) : (
                <p className="text-muted-foreground">{profile.opening_hours || "Non renseigné"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Media Upload Section - Instagram-like */}
        <MediaUpload />

        {/* Pricing Section */}
        <BusinessPricing />
      </div>

      <BottomNav />
    </div>
  );
}