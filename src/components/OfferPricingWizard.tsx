import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BusinessPricingSetup } from "@/components/ui/business-pricing-setup";
import { PricingRulesManager } from "@/components/PricingRulesManager";
import { Euro, Zap, TrendingUp } from "lucide-react";

interface OfferPricingWizardProps {
  businessUserId: string;
  offerId?: string;
  onComplete?: (data: { pricingOptions: any[]; rules: any[] }) => void;
  className?: string;
}

export function OfferPricingWizard({ 
  businessUserId, 
  offerId, 
  onComplete, 
  className 
}: OfferPricingWizardProps) {
  const [pricingOptions, setPricingOptions] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState("pricing");
  const [isComplete, setIsComplete] = useState(false);

  const handlePricingComplete = (options: any[]) => {
    setPricingOptions(options);
    if (options.length > 0) {
      setCurrentTab("rules");
    }
  };

  const handleFinish = () => {
    setIsComplete(true);
    onComplete?.({ pricingOptions, rules: [] });
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
          Assistant de tarification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configurez vos prix et règles dynamiques en quelques étapes
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Euro size={16} />
              Tarifs de base
            </TabsTrigger>
            <TabsTrigger 
              value="rules" 
              disabled={pricingOptions.length === 0}
              className="flex items-center gap-2"
            >
              <Zap size={16} />
              Règles dynamiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Étape 1: Configurez vos tarifs</h3>
              <p className="text-sm text-muted-foreground">
                Définissez les prix de base pour votre offre. Vous pourrez ensuite ajouter des règles dynamiques.
              </p>
            </div>
            
            <BusinessPricingSetup
              businessUserId={businessUserId}
              onPricingComplete={handlePricingComplete}
            />

            {pricingOptions.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentTab("rules")}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Continuer vers les règles
                  <Zap size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Étape 2: Règles dynamiques (optionnel)</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez des règles pour ajuster automatiquement les prix selon les participants, l'heure, ou le jour.
              </p>
            </div>

            {offerId ? (
              <PricingRulesManager offerId={offerId} />
            ) : (
              <Card className="border-dashed border-border">
                <CardContent className="p-6 text-center">
                  <div className="space-y-2">
                    <Zap size={24} className="mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Les règles dynamiques seront disponibles après la création de l'offre.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentTab("pricing")}
              >
                Retour aux tarifs
              </Button>
              <Button
                onClick={handleFinish}
                className="bg-gradient-primary hover:opacity-90"
              >
                Terminer la configuration
                <TrendingUp size={16} className="ml-2" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}