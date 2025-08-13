import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Clock, Users, Euro, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PricingFormData {
  service_name: string;
  description: string;
  price_type: string;
  price_amount: string;
  duration_minutes: string;
  max_participants: string;
  min_participants: string;
  special_conditions: string;
  is_active: boolean;
}

const priceTypeLabels = {
  per_hour: 'Par heure',
  per_game: 'Par partie',
  per_person: 'Par personne', 
  fixed: 'Prix fixe',
  per_day: 'Par jour',
  custom: 'Personnalisé'
};

export function BusinessPricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PricingFormData>({
    service_name: '',
    description: '',
    price_type: 'fixed',
    price_amount: '',
    duration_minutes: '',
    max_participants: '',
    min_participants: '1',
    special_conditions: '',
    is_active: true
  });

  // Récupérer les tarifs existants
  const { data: pricings = [] } = useQuery({
    queryKey: ['business-pricing', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('business_pricing')
        .select('*')
        .eq('business_user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mutation pour créer/modifier un tarif
  const savePricingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        const { error } = await supabase
          .from('business_pricing')
          .update(data)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_pricing')
          .insert({ ...data, business_user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-pricing', user?.id] });
      resetForm();
      toast({
        title: editingId ? "Tarif modifié" : "Tarif ajouté",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le tarif.",
        variant: "destructive"
      });
      console.error('Error saving pricing:', error);
    }
  });

  // Mutation pour supprimer un tarif
  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_pricing')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-pricing', user?.id] });
      toast({
        title: "Tarif supprimé",
        description: "Le tarif a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le tarif.",
        variant: "destructive"
      });
      console.error('Error deleting pricing:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      price_type: 'fixed',
      price_amount: '',
      duration_minutes: '',
      max_participants: '',
      min_participants: '1',
      special_conditions: '',
      is_active: true
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (pricing: any) => {
    setFormData({
      service_name: pricing.service_name,
      description: pricing.description || '',
      price_type: pricing.price_type,
      price_amount: pricing.price_amount.toString(),
      duration_minutes: pricing.duration_minutes?.toString() || '',
      max_participants: pricing.max_participants?.toString() || '',
      min_participants: pricing.min_participants?.toString() || '1',
      special_conditions: pricing.special_conditions || '',
      is_active: pricing.is_active
    });
    setEditingId(pricing.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const pricingData = {
      service_name: formData.service_name,
      description: formData.description || null,
      price_type: formData.price_type,
      price_amount: parseFloat(formData.price_amount),
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      min_participants: parseInt(formData.min_participants),
      special_conditions: formData.special_conditions || null,
      is_active: formData.is_active
    };

    savePricingMutation.mutate(pricingData);
  };

  const formatPrice = (amount: number, type: string, duration?: number) => {
    const price = `${amount}€`;
    switch (type) {
      case 'per_hour':
        return `${price}/h${duration ? ` (${duration}min)` : ''}`;
      case 'per_game':
        return `${price}/partie`;
      case 'per_person':
        return `${price}/pers`;
      case 'per_day':
        return `${price}/jour`;
      case 'custom':
        return price;
      default:
        return price;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-poppins font-bold text-gradient-primary">
            Tarifs & Formules
          </h2>
          <p className="text-muted-foreground">
            Configurez vos prix et créez des formules personnalisées
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-flame text-white">
          <Plus size={16} className="mr-2" />
          Ajouter un tarif
        </Button>
      </div>

      {/* Liste des tarifs existants */}
      {pricings.length > 0 && (
        <div className="grid gap-4">
          {pricings.map((pricing) => (
            <Card key={pricing.id} className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{pricing.service_name}</h3>
                      <Badge variant={pricing.is_active ? "default" : "secondary"}>
                        {pricing.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline">
                        {priceTypeLabels[pricing.price_type as keyof typeof priceTypeLabels]}
                      </Badge>
                    </div>
                    
                    {pricing.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {pricing.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Euro size={16} className="text-primary" />
                        <span className="font-medium">
                          {formatPrice(pricing.price_amount, pricing.price_type, pricing.duration_minutes)}
                        </span>
                      </div>
                      
                      {pricing.min_participants && pricing.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users size={16} className="text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {pricing.min_participants === pricing.max_participants 
                              ? `${pricing.min_participants} pers`
                              : `${pricing.min_participants}-${pricing.max_participants} pers`
                            }
                          </span>
                        </div>
                      )}
                      
                      {pricing.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} className="text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {Math.floor(pricing.duration_minutes / 60)}h{pricing.duration_minutes % 60 > 0 && `${pricing.duration_minutes % 60}min`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {pricing.special_conditions && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {pricing.special_conditions}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(pricing)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePricingMutation.mutate(pricing.id)}
                      disabled={deletePricingMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Modifier le tarif' : 'Nouveau tarif'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_name">Nom du service *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                    placeholder="Ex: Bowling 1 partie"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="price_type">Type de tarification *</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, price_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priceTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée du service..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price_amount">Prix (€) *</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    step="0.01"
                    value={formData.price_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {formData.price_type === 'per_hour' && (
                  <div>
                    <Label htmlFor="duration_minutes">Durée (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="min_participants">Participants min</Label>
                  <Input
                    id="min_participants"
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_participants: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_participants">Participants max</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    placeholder="Illimité"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Tarif actif</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="special_conditions">Conditions spéciales</Label>
                <Textarea
                  id="special_conditions"
                  value={formData.special_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_conditions: e.target.value }))}
                  placeholder="Conditions particulières, réductions, etc..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={savePricingMutation.isPending}
                  className="bg-gradient-flame text-white"
                >
                  {savePricingMutation.isPending ? 'Enregistrement...' : (editingId ? 'Modifier' : 'Ajouter')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}