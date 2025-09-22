import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UserFlame {
  id: string;
  user_id: string;
  offer_id: string;
  created_at: string;
}

export function useFlames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userFlames, setUserFlames] = useState<UserFlame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserFlames();
    } else {
      setUserFlames([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserFlames = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('flames')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserFlames(data || []);
    } catch (error) {
      console.error('Error fetching user flames:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos flammes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const giveFlame = async (offerId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour donner une flamme.",
        variant: "destructive"
      });
      return false;
    }

    // Vérifier si l'utilisateur a déjà donné une flamme à cette offre
    const existingFlame = userFlames.find(flame => flame.offer_id === offerId);
    
    if (existingFlame) {
      return await removeFlame(offerId);
    }

    try {
      const { data, error } = await supabase
        .from('flames')
        .insert({
          user_id: user.id,
          offer_id: offerId
        })
        .select()
        .single();

      if (error) throw error;

      // Mise à jour immédiate de l'état local
      setUserFlames(prev => [...prev, data]);
      
      // Refresh flame counts
      queryClient.invalidateQueries({ queryKey: ["flamesCounts"] });
      queryClient.invalidateQueries({ queryKey: ["flamesCount"] });
      
      toast({
        title: "Flamme donnée !",
        description: "Votre flamme a été donnée à cette offre.",
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

  const removeFlame = async (offerId: string) => {
    if (!user) return false;

    const existingFlame = userFlames.find(flame => flame.offer_id === offerId);
    if (!existingFlame) return false;

    try {
      const { error } = await supabase
        .from('flames')
        .delete()
        .eq('user_id', user.id)
        .eq('offer_id', offerId);

      if (error) throw error;

      // Mise à jour immédiate de l'état local
      setUserFlames(prev => prev.filter(flame => flame.offer_id !== offerId));
      
      // Refresh flame counts
      queryClient.invalidateQueries({ queryKey: ["flamesCounts"] });
      queryClient.invalidateQueries({ queryKey: ["flamesCount"] });
      
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
    return userFlames.some(flame => flame.offer_id === offerId);
  };

  const canGiveFlame = () => {
    return !!user;
  };

  return {
    userFlames,
    isLoading,
    giveFlame,
    removeFlame,
    hasGivenFlameToOffer,
    canGiveFlame,
    refetch: fetchUserFlames
  };
}