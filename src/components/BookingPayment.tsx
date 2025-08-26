import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingPaymentProps {
  bookingId: string;
  amount: number; // Amount in cents
  description: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export function BookingPayment({ 
  bookingId, 
  amount, 
  description, 
  onPaymentSuccess, 
  onPaymentError 
}: BookingPaymentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  const handlePayment = async () => {
    if (!user) {
      onPaymentError("Vous devez être connecté pour effectuer un paiement");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      console.log("💳 Starting payment process...");

      // Get current session
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        throw new Error("Session invalide");
      }

      // Create payment intent
      console.log("📞 Creating payment intent...");
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-booking-payment', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          bookingId,
          amount,
          description
        }
      });

      if (paymentError || paymentData?.error) {
        throw new Error(paymentError?.message || paymentData?.error || "Erreur lors de la création du paiement");
      }

      console.log("✅ Payment intent created");

      // For now, we'll simulate the payment process
      // In a real app, you would integrate with Stripe Elements here
      console.log("💰 Processing payment...");
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify payment (in real app, this would be called after Stripe confirmation)
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-booking-payment', {
        body: {
          paymentIntentId: paymentData.payment_intent_id
        }
      });

      if (verificationError || verificationData?.error) {
        throw new Error("Erreur lors de la vérification du paiement");
      }

      if (verificationData?.paid) {
        setPaymentStatus('succeeded');
        toast({
          title: "Paiement effectué !",
          description: "Votre réservation a été confirmée et payée.",
        });
        onPaymentSuccess();
      } else {
        throw new Error("Le paiement n'a pas pu être traité");
      }

    } catch (error: any) {
      console.error("💥 Payment error:", error);
      setPaymentStatus('failed');
      
      const errorMessage = error.message || "Erreur lors du paiement";
      toast({
        title: "Erreur de paiement",
        description: errorMessage,
        variant: "destructive"
      });
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={20} />
          Paiement de la réservation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Montant :</span>
            <span className="font-semibold">€{formatAmount(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service :</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
        </div>

        {paymentStatus === 'pending' && (
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Payer €{formatAmount(amount)}
              </>
            )}
          </Button>
        )}

        {paymentStatus === 'processing' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Traitement du paiement en cours...
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'succeeded' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Paiement effectué avec succès ! Votre réservation est confirmée.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Le paiement a échoué. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Paiement sécurisé par Stripe</p>
          <p>• Commission plateforme : 5%</p>
          <p>• Les fonds sont versés directement à l'entreprise</p>
        </div>
      </CardContent>
    </Card>
  );
}