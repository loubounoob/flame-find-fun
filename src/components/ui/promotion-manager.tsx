import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CalendarIcon, Plus, Trash2, Edit, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePromotions } from "@/hooks/usePromotions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PromotionFormData {
  title: string;
  description: string;
  offer_id: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_item' | 'buy_x_get_y';
  discount_value: number;
  discount_text: string;
  start_date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  max_participants?: number;
  is_active: boolean;
}

export function PromotionManager() {
  const { user } = useAuth();
  const { businessPromotions, createPromotion, updatePromotion, deletePromotion, getTimeRemaining } = usePromotions();
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    description: "",
    offer_id: "",
    discount_type: "percentage",
    discount_value: 0,
    discount_text: "",
    start_date: new Date(),
    end_date: new Date(),
    start_time: "09:00",
    end_time: "18:00",
    max_participants: undefined,
    is_active: true,
  });
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [buyXGetYDetails, setBuyXGetYDetails] = useState({
    getQuantity: "",
    freeItem: "",
    conditions: ""
  });

  // Fetch business offers with pricing for the form
  const { data: businessOffers = [] } = useQuery({
    queryKey: ["business-offers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('id, title, price, base_price, pricing_options')
        .eq('business_user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data;
    },
    enabled: !!user && user.user_metadata?.account_type === 'business',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const startDateTime = new Date(formData.start_date);
    const [startHour, startMinute] = formData.start_time.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

    const endDateTime = new Date(formData.end_date);
    const [endHour, endMinute] = formData.end_time.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

    // Calculate prices based on selected offer
    let originalPrice = 0;
    let promotionalPrice = 0;

    if (selectedOffer) {
      originalPrice = selectedOffer.base_price || parseFloat(selectedOffer.price?.replace(/[^\d.]/g, '') || '0');
      
      if (formData.discount_type === 'percentage') {
        promotionalPrice = originalPrice * (1 - formData.discount_value / 100);
      } else if (formData.discount_type === 'fixed_amount') {
        promotionalPrice = originalPrice - formData.discount_value;
      } else {
        promotionalPrice = originalPrice; // For free_item and buy_x_get_y
      }
    }

    const promotionData = {
      business_user_id: user.id,
      offer_id: formData.offer_id,
      title: formData.title,
      description: formData.description,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      discount_text: formData.discount_text,
      original_price: originalPrice,
      promotional_price: Math.max(0, promotionalPrice),
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      is_active: formData.is_active,
      max_participants: formData.max_participants,
    };

    if (editingPromotion) {
      updatePromotion({ id: editingPromotion, ...promotionData });
    } else {
      createPromotion(promotionData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      offer_id: "",
      discount_type: "percentage",
      discount_value: 0,
      discount_text: "",
      start_date: new Date(),
      end_date: new Date(),
      start_time: "09:00",
      end_time: "18:00",
      max_participants: undefined,
      is_active: true,
    });
    setSelectedOffer(null);
    setShowForm(false);
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: any) => {
    const offer = businessOffers.find(o => o.id === promotion.offer_id);
    setSelectedOffer(offer);
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      offer_id: promotion.offer_id,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      discount_text: promotion.discount_text,
      start_date: new Date(promotion.start_date),
      end_date: new Date(promotion.end_date),
      start_time: format(new Date(promotion.start_date), "HH:mm"),
      end_time: format(new Date(promotion.end_date), "HH:mm"),
      max_participants: promotion.max_participants,
      is_active: promotion.is_active,
    });
    setEditingPromotion(promotion.id);
    setShowForm(true);
  };

  // Helper functions for price calculation
  const getOriginalPrice = () => {
    if (!selectedOffer) return 0;
    return selectedOffer.base_price || parseFloat(selectedOffer.price?.replace(/[^\d.]/g, '') || '0');
  };

  const calculatePromotionalPrice = () => {
    const originalPrice = getOriginalPrice();
    
    if (formData.discount_type === 'percentage') {
      return (originalPrice * (1 - formData.discount_value / 100)).toFixed(2);
    } else if (formData.discount_type === 'fixed_amount') {
      return Math.max(0, originalPrice - formData.discount_value).toFixed(2);
    }
    return originalPrice.toFixed(2);
  };

  const generateDiscountText = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `-${value}%`;
      case 'fixed_amount':
        return `-${value}€`;
      case 'free_item':
        return `${value} gratuit${value > 1 ? 's' : ''}`;
      case 'buy_x_get_y':
        return `${value + 1} pour ${value}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          size="lg"
        >
          <Plus size={16} className="mr-2" />
          Créer une Offre Flash
        </Button>
      </div>

      {/* Promotion Form */}
      {showForm && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-orange-500" />
              {editingPromotion ? "Modifier l'Offre Flash" : "Nouvelle Offre Flash"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre de la promotion</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Super Promo Bowling"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="offer_id">Offre concernée</Label>
                  <Select
                    value={formData.offer_id}
                    onValueChange={(value) => {
                      const offer = businessOffers.find(o => o.id === value);
                      setSelectedOffer(offer);
                      setFormData(prev => ({ ...prev, offer_id: value }));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une offre" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessOffers.map((offer) => (
                        <SelectItem key={offer.id} value={offer.id}>
                          {offer.title} - {offer.price || `${offer.base_price}€`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount_type">Type de réduction</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                      <SelectItem value="free_item">Article gratuit</SelectItem>
                      <SelectItem value="buy_x_get_y">Achetez X obtenez Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                {formData.discount_type === "buy_x_get_y" ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="buy_quantity">Nombre d'articles à acheter</Label>
                      <Input
                        id="buy_quantity"
                        type="number"
                        min="1"
                        value={formData.discount_value}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setFormData(prev => ({ 
                            ...prev, 
                            discount_value: value,
                            discount_text: generateDiscountText(value, formData.discount_type)
                          }));
                        }}
                        placeholder="ex: 2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="get_quantity">Nombre d'articles gratuits</Label>
                      <Input
                        id="get_quantity"
                        type="number"
                        min="1"
                        value={buyXGetYDetails.getQuantity}
                        onChange={(e) => setBuyXGetYDetails(prev => ({...prev, getQuantity: e.target.value}))}
                        placeholder="ex: 1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="free_item">Article gratuit (optionnel)</Label>
                      <Input
                        id="free_item"
                        value={buyXGetYDetails.freeItem}
                        onChange={(e) => setBuyXGetYDetails(prev => ({...prev, freeItem: e.target.value}))}
                        placeholder="ex: boisson, dessert..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="conditions">Conditions spéciales (optionnel)</Label>
                      <Textarea
                        id="conditions"
                        value={buyXGetYDetails.conditions}
                        onChange={(e) => setBuyXGetYDetails(prev => ({...prev, conditions: e.target.value}))}
                        placeholder="ex: valable sur une sélection d'articles..."
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="discount_value">
                      {formData.discount_type === 'percentage' && "Pourcentage de réduction (%)"}
                      {formData.discount_type === 'fixed_amount' && "Montant de réduction (€)"}
                      {formData.discount_type === 'free_item' && "Nombre d'articles gratuits"}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setFormData(prev => ({ 
                          ...prev, 
                          discount_value: value,
                          discount_text: generateDiscountText(value, formData.discount_type)
                        }));
                      }}
                      placeholder={
                        formData.discount_type === 'percentage' ? "Ex: 20" :
                        formData.discount_type === 'fixed_amount' ? "Ex: 5.00" :
                        "Ex: 1"
                      }
                      required
                    />
                  </div>
                )}
                </div>

                 {/* Prix preview */}
                 {selectedOffer && formData.discount_value > 0 && (
                   <div className="col-span-1 md:col-span-2">
                     <div className="bg-muted/50 p-4 rounded-lg">
                       <Label>Aperçu des prix</Label>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                         <span className="text-lg font-bold text-primary">
                           {calculatePromotionalPrice()}€
                         </span>
                         <span className="text-sm text-muted-foreground line-through">
                           {getOriginalPrice()}€
                         </span>
                         <Badge variant="secondary" className="w-fit">
                           {formData.discount_text}
                         </Badge>
                       </div>
                     </div>
                   </div>
                 )}

                <div>
                  <Label>Date de début</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.start_date, "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                </div>

                <div>
                  <Label>Date de fin</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.end_date, "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, end_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre offre promotionnelle..."
                />
              </div>

              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Promotion active</Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600">
                      {editingPromotion ? "Modifier" : "Créer"} la Promotion
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Promotions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mes Promotions</h3>
        {businessPromotions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucune promotion créée pour le moment.</p>
          </Card>
        ) : (
          businessPromotions.map((promotion) => {
            const timeRemaining = getTimeRemaining(promotion.end_date);
            
            return (
              <Card key={promotion.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{promotion.title}</h4>
                      <Badge 
                        variant={promotion.is_active ? "default" : "secondary"}
                        className={promotion.is_active ? "bg-green-500" : ""}
                      >
                        {promotion.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          timeRemaining.expired ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                        )}
                      >
                        <Clock size={12} className="mr-1" />
                        {timeRemaining.display}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-primary">
                        {promotion.promotional_price}€
                      </span>
                      <span className="line-through">
                        {promotion.original_price}€
                      </span>
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                        {promotion.discount_text}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      Du {format(new Date(promotion.start_date), "dd/MM/yyyy à HH:mm", { locale: fr })} 
                      au {format(new Date(promotion.end_date), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(promotion)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePromotion(promotion.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}