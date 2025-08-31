import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PricingRule {
  id: string;
  business_user_id: string;
  offer_id?: string;
  rule_type: 'participant_tiers' | 'time_slots' | 'duration_multiplier' | 'seasonal' | 'day_of_week';
  rule_name: string;
  conditions: Record<string, any>;
  price_modifier: number;
  is_percentage: boolean;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export function usePricingRules(offerId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pricing rules
  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ['pricing-rules', user?.id, offerId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('business_pricing_rules')
        .select('*')
        .eq('business_user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (offerId) {
        query = query.or(`offer_id.eq.${offerId},offer_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!user,
  });

  // Create pricing rule
  const createRuleMutation = useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'business_user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('business_pricing_rules')
        .insert({
          ...rule,
          business_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: "Règle créée",
        description: "La règle de tarification a été créée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating pricing rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle de tarification.",
        variant: "destructive",
      });
    },
  });

  // Update pricing rule
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingRule> }) => {
      const { data, error } = await supabase
        .from('business_pricing_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: "Règle mise à jour",
        description: "La règle de tarification a été mise à jour.",
      });
    },
    onError: (error) => {
      console.error('Error updating pricing rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la règle.",
        variant: "destructive",
      });
    },
  });

  // Delete pricing rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: "Règle supprimée",
        description: "La règle de tarification a été supprimée.",
      });
    },
    onError: (error) => {
      console.error('Error deleting pricing rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle.",
        variant: "destructive",
      });
    },
  });

  return {
    pricingRules: pricingRules || [],
    isLoading,
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
  };
}