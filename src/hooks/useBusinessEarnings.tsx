import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useBusinessEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business earnings
  const { data: earnings = [], isLoading: isLoadingEarnings } = useQuery({
    queryKey: ["business_earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("business_earnings")
        .select("*")
        .eq("business_user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch withdrawal requests
  const { data: withdrawals = [], isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["withdrawal_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("business_user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate totals
  const totalEarnings = earnings
    .filter(earning => earning.status === 'completed')
    .reduce((sum, earning) => sum + parseFloat(earning.amount.toString()), 0);

  const totalWithdrawn = withdrawals
    .filter(withdrawal => withdrawal.status === 'completed')
    .reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount.toString()), 0);

  const availableBalance = totalEarnings - totalWithdrawn;

  // Request withdrawal mutation
  const requestWithdrawalMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: { amount }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Retrait demandé",
        description: "Votre demande de retrait a été prise en compte.",
      });
      queryClient.invalidateQueries({ queryKey: ["withdrawal_requests"] });
      queryClient.invalidateQueries({ queryKey: ["business_earnings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le retrait.",
        variant: "destructive",
      });
    },
  });

  return {
    earnings,
    withdrawals,
    totalEarnings,
    totalWithdrawn,
    availableBalance,
    isLoading: isLoadingEarnings || isLoadingWithdrawals,
    requestWithdrawal: requestWithdrawalMutation.mutate,
    isRequestingWithdrawal: requestWithdrawalMutation.isPending,
  };
}