import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface DailyFlame {
  id: string;
  user_id: string;
  flame_date: string;
  offer_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useFlames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dailyFlame, setDailyFlame] = useState<DailyFlame | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDailyFlame();
    } else {
      setDailyFlame(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchDailyFlame = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_flames_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('flame_date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create today's flame entry
        const { data: newFlame, error: createError } = await supabase
          .from('user_flames_daily')
          .insert({
            user_id: user.id,
            flame_date: today,
            offer_id: null
          })
          .select()
          .single();

        if (createError) throw createError;
        setDailyFlame(newFlame);
      } else {
        setDailyFlame(data);
      }
    } catch (error) {
      console.error('Error fetching daily flame:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre flamme quotidienne.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const giveFlame = async (offerId: string) => {
    if (!user || !dailyFlame) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour donner une flamme.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Si l'utilisateur a déjà donné sa flamme à cette offre, on la retire
      if (dailyFlame.offer_id === offerId) {
        return await removeFlame();
      }

      // Sinon, on donne la flamme à cette offre (retire automatiquement de l'autre)
      const { error } = await supabase
        .from('user_flames_daily')
        .update({ offer_id: offerId })
        .eq('id', dailyFlame.id);

      if (error) throw error;

      setDailyFlame(prev => prev ? { ...prev, offer_id: offerId } : null);
      
      toast({
        title: "Flamme donnée !",
        description: "Votre flamme quotidienne a été donnée à cette offre.",
      });
      return true;
    } catch (error) {
      console.error('Error giving flame:', error);
      toast({
        title: "Erreur",
        description: "Impossible de donner votre flamme.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFlame = async () => {
    if (!user || !dailyFlame) return false;

    try {
      const { error } = await supabase
        .from('user_flames_daily')
        .update({ offer_id: null })
        .eq('id', dailyFlame.id);

      if (error) throw error;

      setDailyFlame(prev => prev ? { ...prev, offer_id: null } : null);
      
      toast({
        title: "Flamme retirée",
        description: "Votre flamme a été retirée de cette offre.",
      });
      return true;
    } catch (error) {
      console.error('Error removing flame:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer votre flamme.",
        variant: "destructive"
      });
      return false;
    }
  };

  const hasGivenFlameToOffer = (offerId: string) => {
    return dailyFlame?.offer_id === offerId;
  };

  const canGiveFlame = () => {
    return !!user && !!dailyFlame;
  };

  return {
    dailyFlame,
    isLoading,
    giveFlame,
    removeFlame,
    hasGivenFlameToOffer,
    canGiveFlame,
    refetch: fetchDailyFlame
  };
}