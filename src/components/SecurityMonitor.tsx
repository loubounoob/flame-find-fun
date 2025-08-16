import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function SecurityMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Monitor for suspicious financial activities
    const channel = supabase
      .channel(`security-monitor-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'financial_transactions',
          filter: `business_user_id=eq.${user.id}`,
        },
        (payload) => {
          const transaction = payload.new;
          
          // Alert for large transactions
          if (Math.abs(transaction.amount) > 1000) {
            toast({
              title: "Transaction importante détectée",
              description: `Transaction de ${transaction.amount}€ - ${transaction.transaction_type}`,
            });
          }

          // Alert for rapid succession of transactions
          checkRapidTransactions(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // Alert for security-related notifications
          if (notification.type === 'financial_audit') {
            console.log('Financial audit notification:', notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const checkRapidTransactions = async (userId: string) => {
    try {
      const { data: recentTransactions } = await supabase
        .from('financial_transactions')
        .select('created_at')
        .eq('business_user_id', userId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false });

      if (recentTransactions && recentTransactions.length > 5) {
        toast({
          title: "Activité suspecte détectée",
          description: "Plusieurs transactions en peu de temps",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Security monitoring error:', error);
    }
  };

  return null; // This is a monitoring component, no UI
}