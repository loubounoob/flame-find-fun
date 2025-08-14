import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Erreur",
          description: "Session de paiement introuvable.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data.success) {
          setPaymentConfirmed(true);
          toast({
            title: "Paiement confirmé !",
            description: "Votre réservation a été confirmée avec succès.",
          });
        } else {
          toast({
            title: "Paiement non confirmé",
            description: "Le paiement n'a pas pu être vérifié.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier le paiement.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={48} />
            <h2 className="text-xl font-semibold mb-2">Vérification du paiement...</h2>
            <p className="text-muted-foreground">Veuillez patienter quelques instants.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto mb-4 text-green-500" size={64} />
          <CardTitle className="text-2xl text-green-600">
            {paymentConfirmed ? "Paiement confirmé !" : "Paiement effectué"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {paymentConfirmed 
              ? "Votre réservation a été confirmée avec succès. Vous recevrez un email de confirmation."
              : "Votre paiement a été traité. Vérification en cours..."
            }
          </p>
          
          <div className="space-y-2">
            <Button onClick={() => navigate("/")} className="w-full">
              Retour à l'accueil
            </Button>
            <Button onClick={() => navigate("/profile")} variant="outline" className="w-full">
              Mes réservations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}