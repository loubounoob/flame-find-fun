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
  is_archived?: boolean;
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

  const createBooking = async (bookingData: {
    offerId: string;
    businessUserId: string;
    participantCount: number;
    notes?: string;
    bookingDate?: string;
  }) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour faire une réservation.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const bookingInsert = {
        user_id: user.id,
        offer_id: bookingData.offerId,
        business_user_id: bookingData.businessUserId,
        participant_count: bookingData.participantCount,
        notes: bookingData.notes,
        ...(bookingData.bookingDate && { booking_date: bookingData.bookingDate })
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Réservation créée !",
        description: "Votre réservation a été créée avec succès.",
      });
      
      fetchBookings(); // Actualiser la liste
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation.",
        variant: "destructive"
      });
      return null;
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