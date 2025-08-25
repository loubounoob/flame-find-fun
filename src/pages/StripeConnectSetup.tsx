import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BusinessPricingSetup } from "@/components/ui/business-pricing-setup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function StripeConnectSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user profile and Stripe Connect status
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleStripeConnect = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting Stripe Connect setup...");
      
      // Refresh session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error("❌ Session refresh failed:", sessionError);
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      console.log("📞 Calling setup-stripe-connect function...");
      
      const { data, error } = await supabase.functions.invoke('setup-stripe-connect', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      console.log("📝 Function response:", { data, error });
      
      if (error) {
        console.error("❌ Function error:", error);
        throw new Error(error.message || "Erreur lors de l'appel de la fonction");
      }
      
      if (data?.error) {
        console.error("❌ Server error:", data.error);
        throw new Error(data.error);
      }
      
      if (data?.onboarding_url) {
        console.log("✅ Opening Stripe onboarding URL:", data.onboarding_url);
        // Open Stripe onboarding in new tab
        window.open(data.onboarding_url, '_blank');
        
        toast({
          title: "Redirection vers Stripe",
          description: "Une nouvelle fenêtre s'est ouverte pour configurer votre compte Stripe Connect.",
        });
      } else {
        throw new Error("Aucune URL d'onboarding reçue du serveur");
      }
    } catch (error: any) {
      console.error("💥 Stripe Connect setup error:", error);
      
      let errorMessage = "Impossible de configurer Stripe Connect.";
      let shouldRedirect = false;
      
      if (error.message) {
        errorMessage = error.message;
        
        // Check for specific errors that should redirect to support
        if (error.message.includes("Configuration Stripe manquante") || 
            error.message.includes("Stripe secret key") ||
            error.message.includes("Session expirée")) {
          shouldRedirect = true;
        }
      }
      
      toast({
        title: "Erreur de configuration",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Redirect to business profile with error state
      if (shouldRedirect) {
        setTimeout(() => {
          navigate("/business-profile?error=stripe_config");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    if (!profile?.stripe_connect_account_id) return;
    
    try {
      console.log("🔍 Checking Stripe status...");
      
      const { data, error } = await supabase.functions.invoke('check-stripe-connect', {
        body: { accountId: profile.stripe_connect_account_id }
      });
      
      console.log("📝 Status check response:", { data, error });
      
      if (error) {
        console.error("❌ Status check error:", error);
        return;
      }
      
      // Refresh profile data
      await refetchProfile();
      
      if (data?.charges_enabled) {
        toast({
          title: "Configuration terminée !",
          description: "Votre compte Stripe Connect est maintenant actif.",
        });
      }
    } catch (error) {
      console.error("❌ Error checking Stripe status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le statut Stripe",
        variant: "destructive"
      });
    }
  };

  // Check if user is a business user - same logic as edge function
  const isBusinessUser = user?.user_metadata?.account_type === "business" || 
                         user?.app_metadata?.account_type === "business";
  
  if (!user || !isBusinessUser) {
    navigate("/auth");
    return null;
  }

  const isStripeConnected = profile?.stripe_connect_charges_enabled;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/business-profile")}>
            <CreditCard size={20} />
          </Button>
          <h1 className="text-2xl font-poppins font-bold text-foreground">
            Configuration des paiements
          </h1>
        </div>
        <p className="text-muted-foreground">
          Configurez Stripe Connect pour recevoir des paiements directement
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stripe Connect Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Compte Stripe Connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile?.stripe_connect_account_id ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous devez configurer Stripe Connect pour recevoir des paiements.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleStripeConnect}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Configuration..." : "Configurer Stripe Connect"}
                  <ExternalLink size={16} className="ml-2" />
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Compte créé</span>
                  <Badge variant="secondary">
                    <CheckCircle size={14} className="mr-1" />
                    Oui
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Informations complétées</span>
                  <Badge variant={profile.stripe_connect_onboarding_completed ? "default" : "secondary"}>
                    {profile.stripe_connect_onboarding_completed ? (
                      <>
                        <CheckCircle size={14} className="mr-1" />
                        Oui
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="mr-1" />
                        Non
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Paiements activés</span>
                  <Badge variant={profile.stripe_connect_charges_enabled ? "default" : "destructive"}>
                    {profile.stripe_connect_charges_enabled ? (
                      <>
                        <CheckCircle size={14} className="mr-1" />
                        Oui
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="mr-1" />
                        Non
                      </>
                    )}
                  </Badge>
                </div>

                {!profile.stripe_connect_charges_enabled && (
                  <div className="pt-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p>Votre compte Stripe Connect n'est pas encore actif.</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={handleStripeConnect}
                            disabled={isLoading}
                          >
                            Terminer la configuration
                            <ExternalLink size={14} className="ml-1" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={checkStripeStatus}
                          >
                            Vérifier le statut
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Setup - Only show if Stripe is connected */}
        {isStripeConnected && (
          <BusinessPricingSetup 
            businessUserId={user.id}
            onPricingComplete={(options) => {
              console.log("Pricing options configured:", options);
            }}
          />
        )}

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Commissions transparentes :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Commission plateforme : 5% du montant</li>
                <li>• Frais Stripe : ~2.9% + 0.25€ par transaction</li>
                <li>• Vous recevez le reste directement sur votre compte</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Versements :</h4>
              <p className="text-sm text-muted-foreground">
                Les fonds sont versés automatiquement sur votre compte bancaire selon la fréquence configurée dans Stripe (généralement sous 2-7 jours ouvrés).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}