import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) throw error;
        setSuccess(data?.success || false);
      } catch (error) {
        console.error('Payment verification error:', error);
        setSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Vérification du paiement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle 
              size={64} 
              className={success ? "text-green-500" : "text-red-500"}
            />
          </div>
          <CardTitle className={success ? "text-green-600" : "text-red-600"}>
            {success ? "Paiement réussi !" : "Erreur de paiement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {success 
              ? "Votre réservation a été confirmée. Vous recevrez une confirmation par email."
              : "Il y a eu un problème avec votre paiement. Veuillez réessayer."
            }
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate("/booking")} 
              className="w-full"
              variant={success ? "default" : "outline"}
            >
              {success ? "Voir mes réservations" : "Réessayer"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="w-full"
            >
              <ArrowLeft size={16} className="mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}