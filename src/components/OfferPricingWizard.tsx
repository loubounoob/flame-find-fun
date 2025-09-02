import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BusinessPricingSetup } from "@/components/ui/business-pricing-setup";
import { Euro, TrendingUp } from "lucide-react";

interface OfferPricingWizardProps {
  businessUserId: string;
  offerId?: string;
  onComplete?: (data: { pricingOptions: any[] }) => void;
  className?: string;
}

export function OfferPricingWizard({ 
  businessUserId, 
  offerId, 
  onComplete, 
  className 
}: OfferPricingWizardProps) {
  const [pricingOptions, setPricingOptions] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handlePricingComplete = (options: any[]) => {
    setPricingOptions(options);
    setIsComplete(true);
    onComplete?.({ pricingOptions: options });
  };

  if (isComplete) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Configuration terminée !</h3>
              <p className="text-sm text-muted-foreground">
                Votre système de tarification est prêt à fonctionner.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {pricingOptions.slice(0, 3).map((option, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {option.service_name}: {option.price_amount}€
                </Badge>
              ))}
              {pricingOptions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{pricingOptions.length - 3} autres
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro size={20} />
          Configuration des tarifs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configurez les options de tarification pour votre activité
        </p>
      </CardHeader>
      <CardContent>
        <BusinessPricingSetup
          businessUserId={businessUserId}
          onPricingComplete={handlePricingComplete}
        />
      </CardContent>
    </Card>
  );
}