import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingDown, TrendingUp, Info } from "lucide-react";
import { useDynamicPricing } from "@/hooks/useDynamicPricing";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicPriceCalculatorProps {
  offerId: string;
  businessUserId: string;
  participantCount: number;
  bookingDate?: string;
  bookingTime?: string;
  className?: string;
}

export function DynamicPriceCalculator({
  offerId,
  businessUserId,
  participantCount,
  bookingDate,
  bookingTime,
  className = "",
}: DynamicPriceCalculatorProps) {
  const { priceCalculation, isCalculating } = useDynamicPricing(
    offerId,
    businessUserId,
    participantCount,
    bookingDate,
    bookingTime
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (isCalculating) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcul du prix...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    );
  }

  if (!priceCalculation) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Impossible de calculer le prix</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Prix calculé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Final Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(priceCalculation.finalPrice)}
            </span>
            {priceCalculation.totalSavings > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">
                  Économie de {formatCurrency(priceCalculation.totalSavings)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        {priceCalculation.breakdown.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="h-4 w-4" />
              Détail du calcul
            </div>
            <div className="space-y-1 text-sm">
              {priceCalculation.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={index === 0 ? "font-medium" : "text-muted-foreground"}>
                    {item.description}
                  </span>
                  <span className={`${
                    index === 0 ? "font-medium" : 
                    item.amount > 0 ? "text-red-500" : "text-green-600"
                  }`}>
                    {index === 0 ? formatCurrency(item.amount) : 
                     item.amount > 0 ? `+${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applied Rules */}
        {priceCalculation.appliedRules.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Règles appliquées
            </div>
            <div className="flex flex-wrap gap-2">
              {priceCalculation.appliedRules.map((rule, index) => (
                <Badge 
                  key={index} 
                  variant={rule.savings && rule.savings > 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {rule.rule_name}
                  {rule.savings && rule.savings > 0 && (
                    <span className="ml-1">
                      (-{formatCurrency(rule.savings)})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {participantCount < 5 && priceCalculation.basePrice > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Astuce économique
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Ajoutez {5 - participantCount} participant{5 - participantCount > 1 ? 's' : ''} 
                  pour potentiellement bénéficier d'un tarif dégressif !
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}