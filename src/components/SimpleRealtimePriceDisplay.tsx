import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimplePricing } from "@/hooks/useSimplePricing";
import { Euro, Info } from "lucide-react";
import React from "react";

interface SimpleRealtimePriceDisplayProps {
  offerId: string;
  businessUserId: string;
  participantCount: number;
  unitsCount: number;
  unitType: string;
  className?: string;
  showBreakdown?: boolean;
  onPriceChange?: (priceData: any) => void;
}

export function SimpleRealtimePriceDisplay({
  offerId,
  businessUserId,
  participantCount,
  unitsCount,
  unitType,
  className,
  showBreakdown = true,
  onPriceChange
}: SimpleRealtimePriceDisplayProps) {
  const { priceCalculation, isCalculating } = useSimplePricing(
    offerId,
    businessUserId,
    participantCount,
    unitsCount
  );

  // Notify parent component of price changes
  React.useEffect(() => {
    if (priceCalculation && onPriceChange) {
      onPriceChange(priceCalculation);
    }
  }, [priceCalculation, onPriceChange]);

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

  const getUnitLabel = (type: string, count: number) => {
    switch (type) {
      case 'game':
        return `${count} partie${count > 1 ? 's' : ''}`;
      case 'hour':
        return `${count} heure${count > 1 ? 's' : ''}`;
      case 'session':
        return `${count} session${count > 1 ? 's' : ''}`;
      default:
        return `${count} unité${count > 1 ? 's' : ''}`;
    }
  };

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'per_game':
        return 'Prix par partie et par joueur';
      case 'per_hour':
        return 'Prix par heure (terrain complet)';
      case 'per_session':
        return 'Prix par session et par participant';
      default:
        return 'Prix par participant';
    }
  };

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Price Display */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(priceCalculation.finalPrice)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {participantCount} participant{participantCount > 1 ? 's' : ''} • {getUnitLabel(unitType, unitsCount)}
              </p>
            </div>
          </div>

          {/* Pricing Type Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Type de tarification:
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {getPricingTypeLabel(priceCalculation.pricingType)}
            </Badge>
          </div>

          {/* Price Breakdown */}
          {showBreakdown && priceCalculation.breakdown.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">
                Détail du calcul:
              </span>
              {priceCalculation.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Info */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-primary">
                  💳 Paiement sécurisé
                </p>
                <p className="text-xs text-primary/80">
                  Paiement en ligne via Stripe - Paiement immédiat
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}