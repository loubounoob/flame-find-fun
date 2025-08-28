import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Shield, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingPaymentProps {
  bookingId: string;
  amount: number;
  description?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export function BookingPayment({
  bookingId,
  amount,
  description,
  onPaymentSuccess,
  onPaymentError
}: BookingPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      setErrorMessage('');

      console.log('🚀 Starting payment process for booking:', bookingId);

      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingId,
          amount: Math.round(amount * 100), // Convert to cents
          description
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment');
      }

      if (!data?.client_secret || !data?.payment_intent_id) {
        throw new Error('Invalid payment response');
      }

      console.log('✅ Payment intent created:', data.payment_intent_id);

      // Simulate payment processing (in a real app, you'd use Stripe Elements)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify payment
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-booking-payment', {
        body: {
          paymentIntentId: data.payment_intent_id
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Payment verification failed');
      }

      if (verifyData?.paid) {
        setPaymentStatus('success');
        toast({
          title: "Paiement réussi",
          description: "Votre paiement a été traité avec succès.",
        });
        onPaymentSuccess?.();
      } else {
        throw new Error('Payment was not successful');
      }

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Une erreur est survenue lors du paiement');
      onPaymentError?.(error.message);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du paiement.",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement de la réservation
          </CardTitle>
          <CardDescription>
            Finalisez votre réservation en effectuant le paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Montant à payer:</span>
              <span className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </span>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>

          {paymentStatus === 'idle' && (
            <Button 
              onClick={handlePayment} 
              className="w-full" 
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payer maintenant
            </Button>
          )}

          {paymentStatus === 'processing' && (
            <Button disabled className="w-full" size="lg">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement en cours...
            </Button>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-600">Paiement réussi!</h3>
              <p className="text-sm text-muted-foreground">
                Votre réservation a été confirmée.
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Paiement sécurisé par Stripe</span>
            </div>
            <p>
              Frais de plateforme: 5% • Votre argent est transféré directement à l'entreprise
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}