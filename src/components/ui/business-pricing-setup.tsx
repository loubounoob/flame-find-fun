import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Plus, X, Euro, Clock, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PricingRulesManager } from "@/components/PricingRulesManager";

interface PricingOption {
  id?: string;
  service_name: string;
  price_amount: number;
  price_type: string;
  duration_minutes?: number;
  max_participants?: number;
  min_participants: number;
  description?: string;
  special_conditions?: string;
  is_active: boolean;
  display_order: number;
}

interface BusinessPricingSetupProps {
  businessUserId: string;
  onPricingComplete?: (options: PricingOption[]) => void;
  onClose?: () => void;
}

export function BusinessPricingSetup({ businessUserId, onPricingComplete, onClose }: BusinessPricingSetupProps) {
  const [options, setOptions] = useState<PricingOption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newOption, setNewOption] = useState<Partial<PricingOption>>({
    service_name: "",
    price_amount: 0,
    price_type: "par_personne",
    duration_minutes: 60,
    max_participants: undefined,
    min_participants: 1,
    description: "",
    special_conditions: "",
    is_active: true,
    display_order: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Interface par défaut pour nouveau tarif
  const initializePricingForm = () => {
    setIsEditing(true);
    setNewOption({
      service_name: "",
      price_amount: 0,
      price_type: "par_personne",
      duration_minutes: 60,
      max_participants: undefined,
      min_participants: 1,
      description: "",
      special_conditions: "",
      is_active: true,
      display_order: 0
    });
  };

  // Fetch existing pricing options
  const { data: existingOptions = [], isLoading } = useQuery({
    queryKey: ["business_pricing", businessUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_pricing")
        .select("*")
        .eq("business_user_id", businessUserId)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessUserId,
  });

  useEffect(() => {
    if (existingOptions.length > 0) {
      setOptions(existingOptions);
      // Ne pas appeler onPricingComplete lors du chargement pour éviter la fermeture automatique
    }
  }, [existingOptions]);

  // Save pricing option
  const savePricingMutation = useMutation({
    mutationFn: async (option: PricingOption) => {
      const { error } = await supabase
        .from("business_pricing")
        .insert({
          business_user_id: businessUserId,
          service_name: option.service_name,
          price_amount: option.price_amount,
          price_type: option.price_type,
          duration_minutes: option.duration_minutes,
          max_participants: option.max_participants,
          min_participants: option.min_participants,
          description: option.description,
          special_conditions: option.special_conditions,
          is_active: option.is_active,
          display_order: option.display_order
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_pricing"] });
      toast({
        title: "Tarif ajouté",
        description: "Votre option de tarification a été sauvegardée.",
      });
    },
  });

  // Update pricing option
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, option }: { id: string; option: PricingOption }) => {
      const { error } = await supabase
        .from("business_pricing")
        .update({
          service_name: option.service_name,
          price_amount: option.price_amount,
          price_type: option.price_type,
          duration_minutes: option.duration_minutes,
          max_participants: option.max_participants,
          min_participants: option.min_participants,
          description: option.description,
          special_conditions: option.special_conditions,
          is_active: option.is_active,
          display_order: option.display_order
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_pricing"] });
      toast({
        title: "Tarif mis à jour",
        description: "Vos modifications ont été sauvegardées.",
      });
    },
  });

  // Delete pricing option
  const deletePricingMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from("business_pricing")
        .delete()
        .eq("id", optionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_pricing"] });
      toast({
        title: "Tarif supprimé",
        description: "L'option de tarification a été supprimée.",
      });
    },
  });

  const addOption = () => {
    if (!newOption.service_name || !newOption.price_amount) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au moins le nom du service et le prix.",
        variant: "destructive",
      });
      return;
    }

    const option = {
      ...newOption,
      display_order: options.length,
      price_amount: Number(newOption.price_amount)
    } as PricingOption;

    if (editingIndex !== null) {
      // Update existing option
      const updatedOptions = [...options];
      updatedOptions[editingIndex] = option;
      setOptions(updatedOptions);
      
      if (existingOptions[editingIndex]?.id) {
        updatePricingMutation.mutate({ 
          id: existingOptions[editingIndex].id!, 
          option 
        });
      }
      setEditingIndex(null);
    } else {
      // Add new option
      setOptions([...options, option]);
      savePricingMutation.mutate(option);
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setNewOption({
      service_name: "",
      price_amount: 0,
      price_type: "par_personne",
      duration_minutes: 60,
      max_participants: undefined,
      min_participants: 1,
      description: "",
      special_conditions: "",
      is_active: true,
      display_order: 0
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const editOption = (index: number) => {
    const option = options[index];
    setNewOption(option);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const removeOption = (index: number) => {
    const optionToRemove = options[index];
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    
    if (optionToRemove.id) {
      deletePricingMutation.mutate(optionToRemove.id);
    }
  };

  const applyTemplate = (template: any) => {
    setNewOption({
      ...template,
      is_active: true,
      display_order: options.length
    });
    setIsEditing(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="w-full bg-gradient-card border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Euro size={18} className="sm:w-5 sm:h-5" />
            Configuration des tarifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Existing options */}
          {options.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Vos tarifs configurés :</Label>
              {options.map((option, index) => (
                <Card key={option.id || index} className="border-border/50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-base truncate">{option.service_name}</h4>
                          {!option.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactif</Badge>
                          )}
                        </div>
                        
                        <div className="text-lg font-bold text-primary mb-3">
                          {option.price_amount}€ 
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            {option.price_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          {option.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {Math.floor(option.duration_minutes / 60)}h{option.duration_minutes % 60 > 0 ? ` ${option.duration_minutes % 60}min` : ""}
                            </span>
                          )}
                          {option.max_participants && (
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {option.min_participants}-{option.max_participants} pers.
                            </span>
                          )}
                        </div>
                        
                        {option.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{option.description}</p>
                        )}
                        
                        {option.special_conditions && (
                          <p className="text-xs text-amber-600">
                            ⚠️ {option.special_conditions}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editOption(index)}
                          className="flex-1 sm:flex-initial text-xs sm:text-sm h-9"
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeOption(index)}
                          className="h-9 px-3"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}


          {/* Add new option */}
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={initializePricingForm}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Ajouter un nouveau tarif
            </Button>
          ) : (
            <div className="bg-card/50 border border-border/50 rounded-lg p-3 sm:p-4 space-y-4">
              {/* Nom et Prix - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_name" className="text-sm font-medium">Nom du service *</Label>
                  <Input
                    id="service_name"
                    value={newOption.service_name}
                    onChange={(e) => setNewOption({...newOption, service_name: e.target.value})}
                    placeholder="Ex: Cours particulier"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_amount" className="text-sm font-medium">Prix *</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    step="0.01"
                    value={newOption.price_amount}
                    onChange={(e) => setNewOption({...newOption, price_amount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Type, Durée, Participants - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_type" className="text-sm font-medium">Type de prix</Label>
                  <Select
                    value={newOption.price_type}
                    onValueChange={(value) => setNewOption({...newOption, price_type: value})}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="par_personne">Par personne</SelectItem>
                      <SelectItem value="par_session">Par session</SelectItem>
                      <SelectItem value="par_heure">Par heure</SelectItem>
                      <SelectItem value="forfait">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">Durée (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newOption.duration_minutes || ""}
                    onChange={(e) => setNewOption({...newOption, duration_minutes: parseInt(e.target.value) || undefined})}
                    placeholder="60"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="max_participants" className="text-sm font-medium">Max participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={newOption.max_participants || ""}
                    onChange={(e) => setNewOption({...newOption, max_participants: parseInt(e.target.value) || undefined})}
                    placeholder="Illimité"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={newOption.description}
                  onChange={(e) => setNewOption({...newOption, description: e.target.value})}
                  placeholder="Décrivez ce service..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Conditions spéciales */}
              <div className="space-y-2">
                <Label htmlFor="special_conditions" className="text-sm font-medium">Conditions spéciales</Label>
                <Input
                  id="special_conditions"
                  value={newOption.special_conditions}
                  onChange={(e) => setNewOption({...newOption, special_conditions: e.target.value})}
                  placeholder="Ex: Réservation 24h à l'avance"
                  className="h-10"
                />
              </div>

              {/* Switch Service actif */}
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="is_active"
                  checked={newOption.is_active}
                  onCheckedChange={(checked) => setNewOption({...newOption, is_active: checked})}
                />
                <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Service actif</Label>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
                <Button onClick={addOption} className="flex-1 h-11">
                  <Plus size={16} className="mr-2" />
                  {editingIndex !== null ? "Mettre à jour" : "Ajouter"}
                </Button>
                <Button variant="outline" onClick={resetForm} className="h-11">
                  Annuler
                </Button>
              </div>
            </div>
          )}
          
          {/* Bouton Terminé pour fermer l'interface */}
          {options.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <Button
                variant="default"
                onClick={() => {
                  onPricingComplete?.(options);
                  onClose?.();
                }}
                className="w-full"
              >
                Terminé - Fermer la configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Pricing Rules */}
      <PricingRulesManager className="mt-6" />
    </div>
  );
}
