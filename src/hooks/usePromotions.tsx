import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Promotion {
  id: string;
  business_user_id: string;
  offer_id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_item' | 'buy_x_get_y';
  discount_value: number;
  discount_text: string;
  original_price: number;
  promotional_price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_participants?: number;
  created_at: string;
  updated_at: string;
}

export function usePromotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active promotions
  const { data: activePromotions = [], isLoading } = useQuery({
    queryKey: ["active-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch business promotions (for business users)
  const { data: businessPromotions = [] } = useQuery({
    queryKey: ["business-promotions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('business_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
    enabled: !!user && user.user_metadata?.account_type === 'business',
  });

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["business-promotions"] });
      toast({
        title: "Promotion créée !",
        description: "Votre offre flash a été créée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la promotion.",
        variant: "destructive"
      });
    }
  });

  // Update promotion mutation
  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["business-promotions"] });
      toast({
        title: "Promotion mise à jour !",
        description: "Votre offre flash a été modifiée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating promotion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la promotion.",
        variant: "destructive"
      });
    }
  });

  // Delete promotion mutation
  const deletePromotionMutation = useMutation({
    mutationFn: async (promotionId: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["business-promotions"] });
      toast({
        title: "Promotion supprimée !",
        description: "L'offre flash a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la promotion.",
        variant: "destructive"
      });
    }
  });

  // Calculate time remaining for a promotion
  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { expired: true, display: "Expiré" };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return { expired: false, display: `${days}j ${hours}h` };
    } else if (hours > 0) {
      return { expired: false, display: `${hours}h ${minutes}min` };
    } else {
      return { expired: false, display: `${minutes}min` };
    }
  };

  return {
    activePromotions,
    businessPromotions,
    isLoading,
    createPromotion: createPromotionMutation.mutate,
    updatePromotion: updatePromotionMutation.mutate,
    deletePromotion: deletePromotionMutation.mutate,
    isCreating: createPromotionMutation.isPending,
    isUpdating: updatePromotionMutation.isPending,
    isDeleting: deletePromotionMutation.isPending,
    getTimeRemaining,
  };
}