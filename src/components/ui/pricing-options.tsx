import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Plus, X, Euro, Clock, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PricingOption {
  id?: string;
  option_name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_default: boolean;
}

interface PricingOptionsProps {
  offerId?: string;
  onPricingChange?: (options: PricingOption[]) => void;
  required?: boolean;
}

export function PricingOptions({ offerId, onPricingChange, required = false }: PricingOptionsProps) {
  const [options, setOptions] = useState<PricingOption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newOption, setNewOption] = useState<Partial<PricingOption>>({
    option_name: "",
    price: 0,
    duration_minutes: undefined,
    description: "",
    is_default: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing pricing options
  const { data: existingOptions = [], isLoading } = useQuery({
    queryKey: ["offer_pricing_options", offerId],
    queryFn: async () => {
      if (!offerId) return [];
      
      const { data, error } = await supabase
        .from("offer_pricing_options")
        .select("*")
        .eq("offer_id", offerId)
        .order("is_default", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!offerId,
  });

  useEffect(() => {
    if (existingOptions.length > 0) {
      setOptions(existingOptions);
      onPricingChange?.(existingOptions);
    }
  }, [existingOptions, onPricingChange]);

  // Save pricing option
  const savePricingMutation = useMutation({
    mutationFn: async (option: PricingOption) => {
      if (!offerId) throw new Error("Offer ID required");

      const { error } = await supabase
        .from("offer_pricing_options")
        .insert({
          offer_id: offerId,
          option_name: option.option_name,
          price: option.price,
          duration_minutes: option.duration_minutes,
          description: option.description,
          is_default: option.is_default
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_pricing_options"] });
      toast({
        title: "Option ajoutée",
        description: "L'option de prix a été ajoutée avec succès.",
      });
    },
  });

  // Delete pricing option
  const deletePricingMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from("offer_pricing_options")
        .delete()
        .eq("id", optionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_pricing_options"] });
      toast({
        title: "Option supprimée",
        description: "L'option de prix a été supprimée.",
      });
    },
  });

  const addOption = () => {
    if (!newOption.option_name || !newOption.price) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au moins le nom et le prix.",
        variant: "destructive",
      });
      return;
    }

    const option = {
      ...newOption,
      id: Date.now().toString(),
      price: Number(newOption.price)
    } as PricingOption;

    // If this is the first option or is_default is true, make it default
    if (options.length === 0 || option.is_default) {
      // Remove default from other options
      const updatedOptions = options.map(opt => ({ ...opt, is_default: false }));
      option.is_default = true;
      setOptions([...updatedOptions, option]);
    } else {
      setOptions([...options, option]);
    }

    // Save to database if offerId exists
    if (offerId) {
      savePricingMutation.mutate(option);
    }

    // Reset form
    setNewOption({
      option_name: "",
      price: 0,
      duration_minutes: undefined,
      description: "",
      is_default: false
    });
    setIsEditing(false);

    // Notify parent component
    onPricingChange?.([...options, option]);
  };

  const removeOption = (index: number) => {
    const optionToRemove = options[index];
    const updatedOptions = options.filter((_, i) => i !== index);
    
    // If we removed the default option and there are other options, make the first one default
    if (optionToRemove.is_default && updatedOptions.length > 0) {
      updatedOptions[0].is_default = true;
    }
    
    setOptions(updatedOptions);
    
    // Delete from database if it has an ID
    if (optionToRemove.id && offerId) {
      deletePricingMutation.mutate(optionToRemove.id);
    }
    
    onPricingChange?.(updatedOptions);
  };

  const setDefaultOption = (index: number) => {
    const updatedOptions = options.map((opt, i) => ({
      ...opt,
      is_default: i === index
    }));
    setOptions(updatedOptions);
    onPricingChange?.(updatedOptions);
  };

  const presetOptions = [
    { name: "Par heure", duration: 60 },
    { name: "Par partie", duration: 30 },
    { name: "Forfait 2h", duration: 120 },
    { name: "Forfait demi-journée", duration: 240 },
    { name: "Forfait journée", duration: 480 },
  ];

  if (isLoading) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro size={20} />
          Options de tarification
          {required && <Badge variant="destructive">Requis</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing options */}
        {options.length > 0 && (
          <div className="space-y-2">
            <Label>Options configurées:</Label>
            {options.map((option, index) => (
              <div key={option.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.option_name}</span>
                    {option.is_default && (
                      <Badge variant="default">Par défaut</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {option.price}€
                    {option.duration_minutes && (
                      <span> • {Math.floor(option.duration_minutes / 60)}h{option.duration_minutes % 60 > 0 ? ` ${option.duration_minutes % 60}min` : ""}</span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!option.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultOption(index)}
                    >
                      Par défaut
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeOption(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {required && options.length === 0 && (
          <p className="text-sm text-red-500 font-medium">
            Au moins une option de prix est requise.
          </p>
        )}

        {/* Add new option */}
        {!isEditing ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Ajouter une option de prix
            </Button>
            
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((preset) => (
                <Button
                  key={preset.name}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewOption({
                      option_name: preset.name,
                      duration_minutes: preset.duration,
                      price: 0,
                      description: "",
                      is_default: options.length === 0
                    });
                    setIsEditing(true);
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="option_name">Nom de l'option</Label>
                  <Input
                    id="option_name"
                    value={newOption.option_name}
                    onChange={(e) => setNewOption({...newOption, option_name: e.target.value})}
                    placeholder="Ex: Par heure"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newOption.price}
                    onChange={(e) => setNewOption({...newOption, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée (minutes) - Optionnel</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newOption.duration_minutes || ""}
                  onChange={(e) => setNewOption({...newOption, duration_minutes: parseInt(e.target.value) || undefined})}
                  placeholder="Ex: 60 pour 1 heure"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description - Optionnel</Label>
                <Textarea
                  id="description"
                  value={newOption.description}
                  onChange={(e) => setNewOption({...newOption, description: e.target.value})}
                  placeholder="Description de cette option..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={newOption.is_default || options.length === 0}
                  onCheckedChange={(checked) => setNewOption({...newOption, is_default: checked})}
                  disabled={options.length === 0}
                />
                <Label htmlFor="is_default">Option par défaut</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={addOption} className="flex-1">
                  <Plus size={16} className="mr-2" />
                  Ajouter
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
