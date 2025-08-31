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
}

export function BusinessPricingSetup({ businessUserId, onPricingComplete }: BusinessPricingSetupProps) {
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

  // Templates populaires
  const pricingTemplates = [
    {
      name: "Cours individuel",
      service_name: "Cours particulier",
      price_amount: 50,
      price_type: "par_session",
      duration_minutes: 60,
      max_participants: 1,
      min_participants: 1,
      description: "Cours personnalisé en one-to-one"
    },
    {
      name: "Cours de groupe",
      service_name: "Cours collectif",
      price_amount: 25,
      price_type: "par_personne",
      duration_minutes: 60,
      max_participants: 8,
      min_participants: 3,
      description: "Cours en petit groupe"
    },
    {
      name: "Stage demi-journée",
      service_name: "Stage intensif",
      price_amount: 120,
      price_type: "par_personne",
      duration_minutes: 240,
      max_participants: 12,
      min_participants: 5,
      description: "Formation intensive de 4 heures"
    },
    {
      name: "Location d'équipement",
      service_name: "Location matériel",
      price_amount: 15,
      price_type: "par_heure",
      duration_minutes: 60,
      description: "Location d'équipement professionnel"
    }
  ];

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
      onPricingComplete?.(existingOptions);
    }
  }, [existingOptions, onPricingComplete]);

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
    onPricingComplete?.([...options, option]);
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
    
    onPricingComplete?.(updatedOptions);
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
    <div className="space-y-6">
      <Card className="w-full bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro size={20} />
            Configuration des tarifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing options */}
          {options.length > 0 && (
            <div className="space-y-3">
              <Label>Vos tarifs configurés :</Label>
              {options.map((option, index) => (
                <Card key={option.id || index} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{option.service_name}</h4>
                          {!option.is_active && (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </div>
                        
                        <div className="text-lg font-bold text-primary mb-2">
                          {option.price_amount}€ 
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            {option.price_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 text-sm text-muted-foreground">
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
                          <p className="text-sm text-muted-foreground mt-2">{option.description}</p>
                        )}
                        
                        {option.special_conditions && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ {option.special_conditions}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editOption(index)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeOption(index)}
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

          {/* Templates */}
          {!isEditing && (
            <div className="space-y-3">
              <Label>Templates populaires :</Label>
              <div className="grid grid-cols-2 gap-2">
                {pricingTemplates.map((template) => (
                  <Button
                    key={template.name}
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate(template)}
                    className="text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.price_amount}€ {template.price_type.replace('_', ' ')}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add new option */}
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Ajouter un nouveau tarif
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_name">Nom du service *</Label>
                    <Input
                      id="service_name"
                      value={newOption.service_name}
                      onChange={(e) => setNewOption({...newOption, service_name: e.target.value})}
                      placeholder="Ex: Cours particulier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_amount">Prix *</Label>
                    <Input
                      id="price_amount"
                      type="number"
                      step="0.01"
                      value={newOption.price_amount}
                      onChange={(e) => setNewOption({...newOption, price_amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_type">Type de prix</Label>
                    <Select
                      value={newOption.price_type}
                      onValueChange={(value) => setNewOption({...newOption, price_type: value})}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="duration">Durée (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newOption.duration_minutes || ""}
                      onChange={(e) => setNewOption({...newOption, duration_minutes: parseInt(e.target.value) || undefined})}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={newOption.max_participants || ""}
                      onChange={(e) => setNewOption({...newOption, max_participants: parseInt(e.target.value) || undefined})}
                      placeholder="Illimité"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newOption.description}
                    onChange={(e) => setNewOption({...newOption, description: e.target.value})}
                    placeholder="Décrivez ce service..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_conditions">Conditions spéciales</Label>
                  <Input
                    id="special_conditions"
                    value={newOption.special_conditions}
                    onChange={(e) => setNewOption({...newOption, special_conditions: e.target.value})}
                    placeholder="Ex: Réservation 24h à l'avance"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newOption.is_active}
                    onCheckedChange={(checked) => setNewOption({...newOption, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Service actif</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addOption} className="flex-1">
                    <Plus size={16} className="mr-2" />
                    {editingIndex !== null ? "Mettre à jour" : "Ajouter"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Advanced Pricing Rules */}
      <PricingRulesManager className="mt-6" />
    </div>
  );
}
