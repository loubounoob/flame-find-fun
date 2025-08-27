import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro, TrendingUp, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function BusinessFinancesDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch business finances
  const { data: finances, refetch: refetchFinances } = useQuery({
    queryKey: ["business-finances", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("business_finances")
        .select("*")
        .eq("business_user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent transactions
  const { data: transactions } = useQuery({
    queryKey: ["financial-transactions", user?.id],
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

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Montant invalide",
        variant: "destructive"
      });
      return;
    }

    if (amount > (finances?.available_balance || 0)) {
      toast({
        title: "Erreur",
        description: "Solde insuffisant",
        variant: "destructive"
      });
      return;
    }

    setIsWithdrawing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('secure-withdrawal', {
        body: {
          businessUserId: user.id,
          amount: amount
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Demande de retrait envoyée !",
          description: `€${amount} sera versé sur votre compte dans 2-7 jours ouvrés.`,
        });
        setWithdrawAmount("");
        refetchFinances();
      }
    } catch (error: any) {
      toast({
        title: "Erreur de retrait",
        description: error.message || "Impossible de traiter la demande",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `€${amount.toFixed(2)}` : "€0.00";
  };

  if (!finances) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro size={20} />
            Finances de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune transaction pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(finances.available_balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des gains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(finances.total_earnings)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total retiré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(finances.total_withdrawn)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      {finances.available_balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={20} />
              Retirer des fonds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Montant à retirer</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={finances.available_balance}
                step="0.01"
              />
              <p className="text-sm text-muted-foreground">
                Maximum: {formatCurrency(finances.available_balance)}
              </p>
            </div>
            
            <Button 
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isWithdrawing}
              className="w-full"
            >
              {isWithdrawing ? "Traitement..." : `Retirer ${withdrawAmount ? `€${parseFloat(withdrawAmount).toFixed(2)}` : "les fonds"}`}
            </Button>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les fonds seront versés sur votre compte bancaire Stripe dans 2-7 jours ouvrés.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Transactions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        transaction.transaction_type === 'earning' ? 'default' : 
                        transaction.transaction_type === 'withdrawal' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {transaction.transaction_type}
                    </Badge>
                    <span 
                      className={`font-medium ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucune transaction pour le moment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}