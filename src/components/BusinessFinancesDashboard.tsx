import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Download, Euro, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBusinessEarnings } from "@/hooks/useBusinessEarnings";

export function BusinessFinancesDashboard() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const {
    earnings,
    withdrawals,
    totalEarnings,
    totalWithdrawn,
    availableBalance,
    isLoading,
    requestWithdrawal,
    isRequestingWithdrawal,
  } = useBusinessEarnings();

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    if (amount > availableBalance) {
      return;
    }

    requestWithdrawal({ amount });
    setWithdrawAmount("");
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `€${amount.toFixed(2)}` : "€0.00";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet size={20} />
            Finances de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
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
              {formatCurrency(availableBalance)}
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
              {formatCurrency(totalEarnings)}
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
              {formatCurrency(totalWithdrawn)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      {availableBalance > 0 && (
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
                max={availableBalance}
                step="0.01"
              />
              <p className="text-sm text-muted-foreground">
                Maximum: {formatCurrency(availableBalance)}
              </p>
            </div>
            
            <Button 
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isRequestingWithdrawal}
              className="w-full"
            >
              {isRequestingWithdrawal ? "Traitement..." : `Retirer ${withdrawAmount ? `€${parseFloat(withdrawAmount).toFixed(2)}` : "les fonds"}`}
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
          {earnings && earnings.length > 0 ? (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div 
                  key={earning.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{earning.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={earning.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {earning.status}
                    </Badge>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(parseFloat(earning.amount.toString()))}
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