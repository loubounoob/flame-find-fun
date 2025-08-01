import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Zap, Star, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";

const plans = [
  {
    id: "free",
    name: "Découverte",
    price: "0€",
    period: "gratuit",
    description: "Pour découvrir Ludigo",
    features: [
      "Voir toutes les offres",
      "1 flamme par jour",
      "Profil basique",
      "Support communautaire"
    ],
    limitations: [
      "Pas de réservations",
      "Publicités",
      "Accès limité aux événements"
    ],
    color: "secondary",
    icon: Zap,
    current: false
  },
  {
    id: "premium",
    name: "Premium Étudiant",
    price: "20€",
    period: "/mois",
    description: "L'abonnement parfait pour les étudiants",
    features: [
      "Réservations illimitées",
      "Flammes illimitées",
      "Accès prioritaire aux événements",
      "Profil premium avec badge",
      "Notifications push",
      "Support prioritaire",
      "Statistiques détaillées",
      "Pas de publicités"
    ],
    color: "primary",
    icon: Crown,
    current: true,
    popular: true
  },
  {
    id: "annual",
    name: "Premium Annuel",
    price: "200€",
    period: "/an",
    description: "2 mois offerts !",
    features: [
      "Tous les avantages Premium",
      "2 mois gratuits",
      "Badge exclusif \"Early Adopter\"",
      "Accès anticipé aux nouvelles fonctionnalités",
      "Invitations VIP aux événements partenaires"
    ],
    color: "flame",
    icon: Star,
    current: false,
    badge: "ÉCONOMIE"
  }
];

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState("premium");

  const handleSubscribe = (planId: string) => {
    console.log("Subscribing to:", planId);
    // Here you would handle the subscription logic
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-poppins font-bold text-foreground">
            Abonnement
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Current Plan */}
        <Card className="bg-gradient-primary border-0">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-primary-foreground" />
            <h2 className="text-xl font-bold text-primary-foreground mb-2">
              Premium Étudiant Actif
            </h2>
            <p className="text-primary-foreground/80 mb-4">
              Renouvelé automatiquement le 15 janvier 2025
            </p>
            <Badge className="bg-white/20 text-primary-foreground border-0">
              Prochaine facture : 20€
            </Badge>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Utilisation ce mois-ci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-flame rounded-xl">
                <div className="text-2xl font-bold text-white">47</div>
                <div className="text-xs text-white/80">Flammes données</div>
              </div>
              <div className="text-center p-3 bg-gradient-secondary rounded-xl">
                <div className="text-2xl font-bold text-secondary-foreground">8</div>
                <div className="text-xs text-secondary-foreground/80">Réservations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="space-y-4">
          <h3 className="text-lg font-poppins font-semibold text-foreground">
            Changer d'abonnement
          </h3>
          
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative bg-gradient-card border-border/50 transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                } ${plan.current ? 'opacity-50' : 'cursor-pointer hover:scale-[1.02]'}`}
                onClick={() => !plan.current && setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground border-0">
                    LE PLUS POPULAIRE
                  </Badge>
                )}
                {plan.badge && (
                  <Badge className="absolute -top-2 right-4 bg-gradient-flame text-white border-0">
                    {plan.badge}
                  </Badge>
                )}
                {plan.current && (
                  <Badge className="absolute -top-2 left-4 bg-success text-white border-0">
                    ACTUEL
                  </Badge>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-${plan.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{plan.price}</div>
                      <div className="text-xs text-muted-foreground">{plan.period}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations && plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-2 opacity-60">
                        <span className="w-4 h-4 text-center text-destructive">×</span>
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  {!plan.current && (
                    <Button 
                      className={`w-full mt-4 bg-gradient-${plan.color} hover:opacity-90`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscribe(plan.id);
                      }}
                    >
                      {plan.id === 'free' ? 'Rétrograder' : 'Choisir ce plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Methods */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Méthode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
              <div className="w-10 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">CB</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expire 12/26</div>
              </div>
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar size={20} />
              Historique de facturation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "15 déc 2024", amount: "20€", status: "Payé" },
                { date: "15 nov 2024", amount: "20€", status: "Payé" },
                { date: "15 oct 2024", amount: "20€", status: "Payé" }
              ].map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">{bill.date}</div>
                    <div className="text-xs text-muted-foreground">Premium Étudiant</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{bill.amount}</div>
                    <Badge variant="outline" className="text-xs">
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}