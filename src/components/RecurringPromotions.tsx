import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, Calendar, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RecurringPromotion {
  id: string;
  offer_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  discount_percentage: number;
  is_active: boolean;
  offer_title?: string;
}

interface RecurringPromotionsProps {
  offers: Array<{ id: string; title: string }>;
  businessUserId: string;
}

interface GroupedPromotion {
  id: string;
  offer_id: string;
  offer_title: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  discount_percentage: number;
  is_active: boolean;
  promotion_ids: string[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

const RecurringPromotions: React.FC<RecurringPromotionsProps> = ({ offers, businessUserId }) => {
  const [recurringPromotions, setRecurringPromotions] = useState<RecurringPromotion[]>([]);
  const [groupedPromotions, setGroupedPromotions] = useState<GroupedPromotion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    offer_id: '',
    days_of_week: [] as number[],
    start_time: '',
    end_time: '',
    discount_percentage: null as number | null
  });

  useEffect(() => {
    loadRecurringPromotions();
  }, [businessUserId]);

  const loadRecurringPromotions = async () => {
    try {
      const { data: promotions, error } = await supabase
        .from('recurring_promotions')
        .select('*')
        .eq('business_user_id', businessUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get offer titles separately
      if (promotions && promotions.length > 0) {
        const offerIds = [...new Set(promotions.map(p => p.offer_id))];
        const { data: offerData } = await supabase
          .from('offers')
          .select('id, title')
          .in('id', offerIds);

        const promotionsWithTitles = promotions.map(promo => ({
          ...promo,
          offer_title: offerData?.find(offer => offer.id === promo.offer_id)?.title || 'Offre inconnue'
        }));

        setRecurringPromotions(promotionsWithTitles);
        groupPromotions(promotionsWithTitles);
      } else {
        setRecurringPromotions([]);
        setGroupedPromotions([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des promotions récurrentes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les promotions récurrentes",
        variant: "destructive",
      });
    }
  };

  const groupPromotions = (promotions: RecurringPromotion[]) => {
    const grouped: { [key: string]: GroupedPromotion } = {};

    promotions.forEach(promo => {
      const key = `${promo.offer_id}_${promo.start_time}_${promo.end_time}_${promo.discount_percentage}`;
      
      if (grouped[key]) {
        grouped[key].days_of_week = [...new Set([...grouped[key].days_of_week, ...promo.days_of_week])];
        grouped[key].promotion_ids.push(promo.id);
        if (!grouped[key].is_active && promo.is_active) {
          grouped[key].is_active = true;
        }
      } else {
        grouped[key] = {
          id: promo.id,
          offer_id: promo.offer_id,
          offer_title: promo.offer_title || 'Offre inconnue',
          days_of_week: [...promo.days_of_week],
          start_time: promo.start_time,
          end_time: promo.end_time,
          discount_percentage: promo.discount_percentage,
          is_active: promo.is_active,
          promotion_ids: [promo.id]
        };
      }
    });

    setGroupedPromotions(Object.values(grouped).sort((a, b) => 
      a.offer_title.localeCompare(b.offer_title)
    ));
  };

  const createRecurringPromotion = async () => {
    if (!newPromotion.offer_id || 
        newPromotion.days_of_week.length === 0 || 
        !newPromotion.start_time || 
        !newPromotion.end_time || 
        !newPromotion.discount_percentage) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs et sélectionner au moins un jour",
        variant: "destructive",
      });
      return;
    }

    if (newPromotion.start_time >= newPromotion.end_time) {
      toast({
        title: "Erreur",
        description: "L'heure de fin doit être après l'heure de début",
        variant: "destructive",
      });
      return;
    }

    // Validate against offer schedules
    try {
      const { data: schedules, error: scheduleError } = await supabase
        .from('offer_schedules')
        .select('*')
        .eq('offer_id', newPromotion.offer_id)
        .eq('is_active', true);

      if (scheduleError) throw scheduleError;

      if (!schedules || schedules.length === 0) {
        toast({
          title: "Erreur",
          description: "Cette offre n'a pas d'horaires configurés. Veuillez d'abord définir les horaires de l'offre.",
          variant: "destructive",
        });
        return;
      }

      // Validate each selected day
      for (const day of newPromotion.days_of_week) {
        const daySchedules = schedules.filter(s => s.days_of_week.includes(day));
        
        if (daySchedules.length === 0) {
          const dayName = DAYS_OF_WEEK.find(d => d.value === day)?.label;
          toast({
            title: "Erreur",
            description: `Cette offre n'est pas disponible le ${dayName}.`,
            variant: "destructive",
          });
          return;
        }

        const isWithinSchedule = daySchedules.some(schedule => {
          return newPromotion.start_time >= schedule.start_time && 
                 newPromotion.end_time <= schedule.end_time;
        });

        if (!isWithinSchedule) {
          const dayName = DAYS_OF_WEEK.find(d => d.value === day)?.label;
          const exampleSchedule = daySchedules[0];
          toast({
            title: "Erreur",
            description: `Les horaires de promotion pour ${dayName} doivent être compris dans les horaires d'ouverture (${exampleSchedule.start_time.substring(0, 5)} - ${exampleSchedule.end_time.substring(0, 5)})`,
            variant: "destructive",
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error validating schedules:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider les horaires",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('recurring_promotions')
        .insert({
          business_user_id: businessUserId,
          offer_id: newPromotion.offer_id,
          days_of_week: newPromotion.days_of_week,
          start_time: newPromotion.start_time,
          end_time: newPromotion.end_time,
          discount_percentage: newPromotion.discount_percentage
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Créneau promotionnel créé avec succès",
      });

      setNewPromotion({
        offer_id: '',
        days_of_week: [],
        start_time: '',
        end_time: '',
        discount_percentage: null
      });
      setIsCreating(false);
      loadRecurringPromotions();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le créneau promotionnel",
        variant: "destructive",
      });
    }
  };

  const deleteRecurringPromotion = async (promotionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('recurring_promotions')
        .delete()
        .in('id', promotionIds);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Promotion récurrente supprimée",
      });

      loadRecurringPromotions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la promotion",
        variant: "destructive",
      });
    }
  };

  const togglePromotionStatus = async (promotionIds: string[], currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_promotions')
        .update({ is_active: !currentStatus })
        .in('id', promotionIds);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Promotion ${!currentStatus ? 'activée' : 'désactivée'}`,
      });

      loadRecurringPromotions();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const getDaysLabel = (days: number[]) => {
    return days
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold">Promotions Récurrentes</h3>
          <p className="text-sm text-muted-foreground">
            Promotions automatiques pour créneaux moins fréquentés
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          variant={isCreating ? "outline" : "default"}
          className="w-full sm:w-auto"
        >
          {isCreating ? 'Annuler' : 'Nouvelle Promotion'}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Créer une promotion récurrente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="offer-select">Offre à promouvoir</Label>
              <Select onValueChange={(value) => setNewPromotion(prev => ({ ...prev, offer_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une offre" />
                </SelectTrigger>
                <SelectContent>
                  {offers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jours de la semaine</Label>
              <div className="space-y-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={newPromotion.days_of_week.includes(day.value)}
                      onCheckedChange={(checked) => {
                        setNewPromotion(prev => ({
                          ...prev,
                          days_of_week: checked
                            ? [...prev.days_of_week, day.value]
                            : prev.days_of_week.filter(d => d !== day.value)
                        }));
                      }}
                    />
                    <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Heure de début</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newPromotion.start_time}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, start_time: e.target.value }))}
                  placeholder="Ex: 14:00"
                />
              </div>
              <div>
                <Label htmlFor="end-time">Heure de fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newPromotion.end_time}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, end_time: e.target.value }))}
                  placeholder="Ex: 18:00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="discount">Pourcentage de réduction (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={newPromotion.discount_percentage ?? ''}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, discount_percentage: e.target.value ? parseInt(e.target.value) : null }))}
                  className="flex-1"
                  placeholder="Ex: 20"
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <Button onClick={createRecurringPromotion} className="w-full">
              Ajouter ce créneau promotionnel
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {groupedPromotions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun créneau promotionnel configuré
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Créez vos créneaux promotionnels pour automatiser vos réductions
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedPromotions.map((promotion) => (
            <Card key={promotion.id} className={promotion.is_active ? 'border-primary' : 'border-muted'}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="font-semibold text-sm sm:text-base">{promotion.offer_title}</h4>
                      <Badge variant={promotion.is_active ? 'default' : 'secondary'} className="w-fit">
                        {promotion.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{getDaysLabel(promotion.days_of_week)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{promotion.start_time.substring(0, 5)} - {promotion.end_time.substring(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{promotion.discount_percentage}% réduction</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePromotionStatus(promotion.promotion_ids, promotion.is_active)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      {promotion.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecurringPromotion(promotion.promotion_ids)}
                      className="px-2 sm:px-3"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringPromotions;