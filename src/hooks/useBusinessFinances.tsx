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

  // Add earnings from a booking
  const addEarningMutation = useMutation({
    mutationFn: async ({ amount, bookingId, description }: { 
      amount: number; 
      bookingId: string; 
      description: string; 
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Add transaction record
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          business_user_id: user.id,
          transaction_type: "earning",
          amount,
          description,
          booking_id: bookingId
        });

      if (transactionError) throw transactionError;

      // Update finances
      const { error: financeError } = await supabase
        .from("business_finances")
        .update({
          available_balance: (finances?.available_balance || 0) + amount,
          total_earnings: (finances?.total_earnings || 0) + amount
        })
        .eq("business_user_id", user.id);

      if (financeError) throw financeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_finances"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    },
  });

  // Request withdrawal
  const requestWithdrawalMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check available balance
      if (!finances || finances.available_balance < amount) {
        throw new Error("Solde insuffisant");
      }

      // Create withdrawal transaction
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          business_user_id: user.id,
          transaction_type: "withdrawal",
          amount: -amount,
          description: `Retrait de ${amount}€`
        });

      if (transactionError) throw transactionError;

      // Update finances
      const { error: financeError } = await supabase
        .from("business_finances")
        .update({
          available_balance: finances.available_balance - amount,
          total_withdrawn: finances.total_withdrawn + amount
        })
        .eq("business_user_id", user.id);

      if (financeError) throw financeError;
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

  // Pay for boost
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

      // Calculate boost score based on amount
      const boostScore = amount / 10; // 1€ = 0.1 boost score

      // Create boost record
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      const { error: boostError } = await supabase
        .from("offer_boosts")
        .insert({
          offer_id: offerId,
          business_user_id: user.id,
          boost_type: boostType,
          boost_score: boostScore,
          end_date: endDate.toISOString(),
          amount_paid: amount
        });

      if (boostError) throw boostError;

      // Add transaction record
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          business_user_id: user.id,
          transaction_type: "boost_payment",
          amount: -amount,
          description: `Boost ${boostType} - ${duration} jours`
        });

      if (transactionError) throw transactionError;

      // Update finances if using balance
      if (finances && finances.available_balance >= amount) {
        const { error: financeError } = await supabase
          .from("business_finances")
          .update({
            available_balance: finances.available_balance - amount,
            total_boost_spent: finances.total_boost_spent + amount
          })
          .eq("business_user_id", user.id);

        if (financeError) throw financeError;
      }
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