import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useBusinessFinances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business finances
  const { data: finances, isLoading } = useQuery({
    queryKey: ["business_finances", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("business_finances")
        .select("*")
        .eq("business_user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // If no record exists, create one
      if (!data) {
        const { data: newFinances, error: createError } = await supabase
          .from("business_finances")
          .insert({
            business_user_id: user.id,
            available_balance: 0,
            total_earnings: 0,
            total_withdrawn: 0,
            total_boost_spent: 0
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newFinances;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["financial_transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("business_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Add earnings from a booking (using secure function)
  const addEarningMutation = useMutation({
    mutationFn: async ({ amount, bookingId, description }: { 
      amount: number; 
      bookingId: string; 
      description: string; 
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Use secure database function
      const { error } = await supabase.rpc('secure_add_earning', {
        p_business_user_id: user.id,
        p_amount: amount,
        p_booking_id: bookingId,
        p_description: description
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_finances"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les gains.",
        variant: "destructive",
      });
    },
  });

  // Request withdrawal (using secure function)
  const requestWithdrawalMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check rate limit first
      const { error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_business_user_id: user.id,
        p_operation_type: 'withdrawal',
        p_max_operations: 5,
        p_window_minutes: 60
      });

      if (rateLimitError) throw rateLimitError;

      // Use secure database function
      const { error } = await supabase.rpc('secure_request_withdrawal', {
        p_business_user_id: user.id,
        p_amount: amount
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Retrait demandé",
        description: "Votre demande de retrait a été prise en compte.",
      });
      queryClient.invalidateQueries({ queryKey: ["business_finances"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le retrait.",
        variant: "destructive",
      });
    },
  });

  // Pay for boost (using secure function)
  const payForBoostMutation = useMutation({
    mutationFn: async ({ 
      offerId, 
      boostType, 
      amount, 
      duration 
    }: { 
      offerId: string; 
      boostType: string; 
      amount: number; 
      duration: number; 
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Check rate limit first
      const { error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_business_user_id: user.id,
        p_operation_type: 'boost_payment',
        p_max_operations: 10,
        p_window_minutes: 60
      });

      if (rateLimitError) throw rateLimitError;

      // Use secure database function
      const { error } = await supabase.rpc('secure_pay_for_boost', {
        p_business_user_id: user.id,
        p_offer_id: offerId,
        p_boost_type: boostType,
        p_amount: amount,
        p_duration: duration
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Boost activé",
        description: "Votre offre a été boostée avec succès!",
      });
      queryClient.invalidateQueries({ queryKey: ["business_finances"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["offer_boosts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer le boost.",
        variant: "destructive",
      });
    },
  });

  return {
    finances,
    transactions,
    isLoading,
    addEarning: addEarningMutation.mutate,
    requestWithdrawal: requestWithdrawalMutation.mutate,
    payForBoost: payForBoostMutation.mutate,
    isAddingEarning: addEarningMutation.isPending,
    isWithdrawing: requestWithdrawalMutation.isPending,
    isPayingBoost: payForBoostMutation.isPending,
  };
}