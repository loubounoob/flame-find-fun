import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!sessionId) {
      setIsVerifying(false);
      setSuccess(false);
      setErrorMessage("Session ID manquant");
      return;
    }

    verifyPayment();
  }, [sessionId, user]);

  const verifyPayment = async () => {
    try {
      setIsVerifying(true);
      
      // Validate session ID format (basic check)
      if (!sessionId || sessionId.length < 10) {
        throw new Error("ID de session invalide");
      }

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('Payment verification error:', error);
        throw new Error(error.message || "Erreur lors de la vérification du paiement");
      }

      if (data?.success) {
        setSuccess(true);
        toast({
          title: "Paiement confirmé !",
          description: "Votre réservation a été créée avec succès.",
        });
      } else {
        throw new Error(data?.error || "Le paiement n'a pas pu être vérifié");
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      setSuccess(false);
      setErrorMessage(error.message || "Erreur lors de la vérification du paiement");
      
      toast({
        title: "Erreur de vérification",
        description: error.message || "Impossible de vérifier le paiement",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    if (sessionId) {
      verifyPayment();
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
              <p className="text-muted-foreground text-center">
                Nous vérifions votre paiement, veuillez patienter.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {success ? "Paiement réussi !" : "Problème de paiement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <>
              <p className="text-center text-muted-foreground">
                Votre réservation a été confirmée avec succès. Vous recevrez un email de confirmation bientôt.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/profile")} 
                  className="w-full"
                  variant="default"
                >
                  Voir mes réservations
                </Button>
                <Button 
                  onClick={() => navigate("/")} 
                  variant="outline"
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                {errorMessage || "Une erreur s'est produite lors du traitement de votre paiement."}
              </p>
              <div className="space-y-2">
                {sessionId && (
                  <Button 
                    onClick={handleRetry} 
                    className="w-full"
                    variant="default"
                  >
                    Réessayer
                  </Button>
                )}
                <Button 
                  onClick={() => navigate("/")} 
                  variant="outline"
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}