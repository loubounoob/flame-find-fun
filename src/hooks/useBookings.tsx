import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Booking {
  id: string;
  user_id: string;
  offer_id: string;
  business_user_id: string;
  booking_date: string;
  status: string;
  participant_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  offer?: {
    title: string;
    category: string;
    location: string;
    image_url?: string;
  };
}

export function useBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          offer:offers(title, category, location, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos réservations.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async (offerId: string, businessUserId: string, participantCount: number = 1, notes?: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour faire une réservation.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          offer_id: offerId,
          business_user_id: businessUserId,
          participant_count: participantCount,
          notes: notes
        });

      if (error) throw error;

      toast({
        title: "Réservation confirmée !",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      
      fetchBookings(); // Actualiser la liste
      return true;
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation.",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée.",
      });
      
      fetchBookings(); // Actualiser la liste
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    bookings,
    isLoading,
    createBooking,
    cancelBooking,
    refetch: fetchBookings
  };
}