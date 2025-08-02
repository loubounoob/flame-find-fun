import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useBookingArchive() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const archiveOldBookings = async () => {
      try {
        const now = new Date();
        
        // Marquer comme archivées les réservations dont la date/heure + 3h est dépassée
        const { error } = await supabase.rpc('archive_old_bookings');
        
        if (error) {
          console.error('Error archiving old bookings:', error);
        }
      } catch (error) {
        console.error('Error in booking archive check:', error);
      }
    };

    // Vérifier toutes les 5 minutes
    const interval = setInterval(archiveOldBookings, 5 * 60 * 1000);
    
    // Vérifier immédiatement
    archiveOldBookings();

    return () => clearInterval(interval);
  }, [user]);
}