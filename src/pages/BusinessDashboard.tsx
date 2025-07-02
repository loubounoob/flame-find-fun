import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BusinessDashboard() {
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [offers, setOffers] = useState([]);
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
    // Load offers for this business
    loadOffers();
  };

  const loadOffers = async () => {
    // Mock data for now
    setOffers([
      {
        id: 1,
        title: "Escape Game Mystery",
        category: "Divertissement",
        price: "15€",
        flames: 45,
        bookings: 12,
        status: "active"
      },
      {
        id: 2,
        title: "Cours de cuisine italienne",
        category: "Formation",
        price: "25€",
        flames: 23,
        bookings: 8,
        status: "active"
      }
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createOffer = async () => {
    // Here you would create the offer in the database
    toast({
      title: "Offre créée",
      description: "Votre offre a été créée avec succès !",
    });
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
    loadOffers();
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>;
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Flammes</p>
                  <p className="text-2xl font-bold">68</p>
                </div>
                <Heart size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-success text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Réservations</p>
                  <p className="text-2xl font-bold">20</p>
                </div>
                <Calendar size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-info text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Vues</p>
                  <p className="text-2xl font-bold">342</p>
                </div>
                <Eye size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Offer Button */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
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
              <CardTitle>Créer une nouvelle offre</CardTitle>
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
                onClick={createOffer}
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={!formData.title || !formData.description || !formData.category}
              >
                Créer l'offre
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offers List */}
        <div className="space-y-4">
          <h2 className="text-lg font-poppins font-semibold text-foreground">Mes offres</h2>
          
          {offers.map((offer) => (
            <Card key={offer.id} className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{offer.title}</h3>
                    <p className="text-sm text-muted-foreground">{offer.category}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Heart size={14} className="text-flame" />
                        <span className="text-sm">{offer.flames}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-success" />
                        <span className="text-sm">{offer.bookings}</span>
                      </div>
                      <Badge variant={offer.status === "active" ? "default" : "secondary"}>
                        {offer.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Edit size={16} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}