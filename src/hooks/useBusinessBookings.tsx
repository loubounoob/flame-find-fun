import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface BusinessBooking {
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
  business?: {
    business_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export function useBusinessBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.user_metadata?.account_type === "business") {
      fetchBusinessBookings();
    } else {
      setBookings([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchBusinessBookings = async () => {
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

      // Get business names separately for each booking
      const bookingsWithBusiness = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: businessData } = await supabase
            .from('profiles')
            .select('business_name, first_name, last_name')
            .eq('user_id', booking.business_user_id)
            .single();

          return {
            ...booking,
            business: businessData
          };
        })
      );

      setBookings(bookingsWithBusiness);
    } catch (error) {
      console.error('Error fetching business bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos réservations.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bookings,
    isLoading,
    refetch: fetchBusinessBookings
  };
}