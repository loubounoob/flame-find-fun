import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  BarChart3, 
  Users, 
  Heart, 
  Calendar,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Eye,
  Flame,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BusinessDashboard() {
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    max_participants: "",
    image_url: "",
    video_url: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.account_type !== "business") {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadOffers();
    loadBookings();
  };

  const loadOffers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Charger les offres avec les flammes et vues
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('business_user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Compter les flammes pour chaque offre
      const { data: flamesData, error: flamesError } = await supabase
        .from('flames')
        .select('offer_id')
        .in('offer_id', offersData?.map(o => o.id) || []);

      if (flamesError) throw flamesError;

      // Compter les vues pour chaque offre
      const { data: viewsData, error: viewsError } = await supabase
        .from('offer_views')
        .select('offer_id')
        .in('offer_id', offersData?.map(o => o.id) || []);

      if (viewsError) throw viewsError;

      // Construire les statistiques par offre
      const flamesCounts = flamesData?.reduce((acc, flame) => {
        acc[flame.offer_id] = (acc[flame.offer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const viewsCounts = viewsData?.reduce((acc, view) => {
        acc[view.offer_id] = (acc[view.offer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const formattedOffers = offersData?.map(offer => ({
        ...offer,
        flames: flamesCounts[offer.id] || 0,
        views: viewsCounts[offer.id] || 0
      })) || [];

      setOffers(formattedOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          offer:offers(title, category)
        `)
        .eq('business_user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createOffer = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          business_user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          location: formData.location,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          image_url: formData.image_url || null,
          video_url: formData.video_url || null
        });

      if (error) throw error;

      toast({
        title: "Offre créée",
        description: "Votre offre a été créée avec succès !",
      });
      
      setShowCreateForm(false);
      resetForm();
      loadOffers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const updateOffer = async () => {
    if (!user || !editingOffer) return;

    try {
      const { error } = await supabase
        .from('offers')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          location: formData.location,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          image_url: formData.image_url || null,
          video_url: formData.video_url || null
        })
        .eq('id', editingOffer.id);

      if (error) throw error;

      toast({
        title: "Offre modifiée",
        description: "Votre offre a été modifiée avec succès !",
      });
      
      setEditingOffer(null);
      setShowCreateForm(false);
      resetForm();
      loadOffers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'offre. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Offre supprimée",
        description: "L'offre a été supprimée avec succès.",
      });
      
      loadOffers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'offre.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title || "",
      description: offer.description || "",
      category: offer.category || "",
      price: offer.price || "",
      location: offer.location || "",
      max_participants: offer.max_participants?.toString() || "",
      image_url: offer.image_url || "",
      video_url: offer.video_url || ""
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setShowCreateForm(false);
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      location: "",
      max_participants: "",
      image_url: "",
      video_url: ""
    });
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>;
  }

  const totalFlames = offers.reduce((sum, offer) => sum + (offer.flames || 0), 0);
  const totalViews = offers.reduce((sum, offer) => sum + (offer.views || 0), 0);
  const totalBookings = bookings.length;
  const activeOffers = offers.filter(offer => offer.status === 'active').length;
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground">
              {user.user_metadata?.company_name || "Dashboard Entreprise"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue, {user.user_metadata?.first_name}
            </p>
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Total Flammes</p>
                  <p className="text-xl font-bold">{totalFlames}</p>
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
                  <p className="text-xl font-bold">{confirmedBookings}</p>
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
                  <p className="text-xl font-bold">{activeOffers}</p>
                </div>
                <BarChart3 size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Total Vues</p>
                  <p className="text-xl font-bold">{totalViews}</p>
                </div>
                <Eye size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="offers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offers">Mes Offres</TabsTrigger>
            <TabsTrigger value="bookings">Réservations</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-4">
            {/* Create Offer Button */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6 text-center">
                <Button 
                  onClick={() => showCreateForm ? resetForm() : setShowCreateForm(true)}
                  className="bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  <Plus className="mr-2" size={20} />
                  {showCreateForm ? "Annuler" : "Créer une nouvelle offre"}
                </Button>
              </CardContent>
            </Card>

            {/* Create Form */}
            {showCreateForm && (
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>{editingOffer ? "Modifier l'offre" : "Créer une nouvelle offre"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre de l'offre</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Ex: Escape Game Mystery"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionne une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="divertissement">Divertissement</SelectItem>
                          <SelectItem value="sport">Sport</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="formation">Formation</SelectItem>
                          <SelectItem value="restauration">Restauration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Décris ton offre en détail..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="15€"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Lyon, France"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_participants">Participants max</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                        placeholder="8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL Image</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video_url">URL Vidéo (optionnel)</Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={editingOffer ? updateOffer : createOffer}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={!formData.title || !formData.description || !formData.category}
                  >
                    {editingOffer ? "Modifier l'offre" : "Créer l'offre"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Offers List */}
            <div className="space-y-4">
              {offers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune offre créée pour le moment.</p>
                </div>
              ) : (
                offers.map((offer) => (
                  <Card key={offer.id} className="bg-gradient-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{offer.title}</h3>
                          <p className="text-sm text-muted-foreground">{offer.category}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Flame size={14} className="text-flame fill-current" />
                              <span className="text-sm">{offer.flames || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye size={14} className="text-info" />
                              <span className="text-sm">{offer.views || 0}</span>
                            </div>
                            <Badge variant={offer.status === "active" ? "default" : "secondary"}>
                              {offer.status === "active" ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => startEditing(offer)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => deleteOffer(offer.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="space-y-4">
              <h2 className="text-lg font-poppins font-semibold text-foreground">Nouvelles réservations</h2>
              
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune réservation pour le moment.</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="bg-gradient-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{booking.offer?.title}</h3>
                          <p className="text-sm text-muted-foreground">{booking.offer?.category}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-primary" />
                              <span className="text-sm">{new Date(booking.booking_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={14} className="text-success" />
                              <span className="text-sm">{booking.participant_count} participant{booking.participant_count > 1 ? 's' : ''}</span>
                            </div>
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status === "confirmed" ? "Confirmé" : booking.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}