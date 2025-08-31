import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDynamicPricing } from "@/hooks/useDynamicPricing";
import { TrendingUp, TrendingDown, Euro, Info } from "lucide-react";

interface RealtimePriceDisplayProps {
  offerId: string;
  businessUserId: string;
  participantCount: number;
  bookingDate?: string;
  bookingTime?: string;
  className?: string;
  showBreakdown?: boolean;
}

export function RealtimePriceDisplay({
  offerId,
  businessUserId,
  participantCount,
  bookingDate,
  bookingTime,
  className,
  showBreakdown = true
}: RealtimePriceDisplayProps) {
  const { priceCalculation, isCalculating } = useDynamicPricing(
    offerId,
    businessUserId,
    participantCount,
    bookingDate,
    bookingTime
  );

  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (priceCalculation && previousPrice !== null) {
      if (priceCalculation.finalPrice > previousPrice) {
        setPriceChange('up');
      } else if (priceCalculation.finalPrice < previousPrice) {
        setPriceChange('down');
      } else {
        setPriceChange(null);
      }
    }
    if (priceCalculation) {
      setPreviousPrice(priceCalculation.finalPrice);
    }
  }, [priceCalculation?.finalPrice]);

  // Reset animation after 2 seconds
  useEffect(() => {
    if (priceChange) {
      const timer = setTimeout(() => setPriceChange(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [priceChange]);

  if (isCalculating) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            {showBreakdown && (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!priceCalculation) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <Euro size={24} className="mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Prix en cours de calcul...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Price Display */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold transition-colors duration-500 ${
                  priceChange === 'up' ? 'text-red-500' : 
                  priceChange === 'down' ? 'text-green-500' : 
                  'text-primary'
                }`}>
                  {formatCurrency(priceCalculation.finalPrice)}
                </span>
                {priceChange === 'up' && <TrendingUp size={20} className="text-red-500" />}
                {priceChange === 'down' && <TrendingDown size={20} className="text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Prix total pour {participantCount} participant{participantCount > 1 ? 's' : ''}
              </p>
            </div>
            
            {priceCalculation.totalSavings > 0 && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                -{formatCurrency(priceCalculation.totalSavings)} économisés
              </Badge>
            )}
          </div>

          {/* Applied Rules */}
          {priceCalculation.appliedRules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Règles appliquées:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {priceCalculation.appliedRules.map((rule, index) => (
                  <Badge 
                    key={index} 
                    variant={rule.savings && rule.savings > 0 ? "secondary" : "outline"}
                    className={`text-xs ${
                      rule.savings && rule.savings > 0 
                        ? "bg-green-500/20 text-green-700" 
                        : ""
                    }`}
                  >
                    {rule.rule_name}
                    {rule.is_percentage ? ` ${rule.modifier > 0 ? '+' : ''}${rule.modifier}%` : 
                     ` ${rule.modifier > 0 ? '+' : ''}${formatCurrency(rule.modifier)}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {showBreakdown && priceCalculation.breakdown.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">
                Détail du calcul:
              </span>
              {priceCalculation.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className={item.amount >= 0 ? "text-foreground" : "text-green-600"}>
                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Economic Tips */}
          {participantCount < 5 && priceCalculation.basePrice > 0 && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700">
                    💡 Conseil économique
                  </p>
                  <p className="text-xs text-blue-600">
                    Ajoutez {5 - participantCount} participant{5 - participantCount > 1 ? 's' : ''} pour 
                    potentiellement bénéficier de tarifs de groupe !
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}