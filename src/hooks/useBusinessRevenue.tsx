import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RevenueStats {
  daily_revenue: number;
  booking_count: number;
  average_booking_value: number;
  stat_date: string;
}

export interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByOffer: Array<{
    offer_id: string;
    offer_title: string;
    total_revenue: number;
    booking_count: number;
  }>;
  dailyStats: RevenueStats[];
}

export function useBusinessRevenue() {
  const { user } = useAuth();

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['business-revenue', user?.id],
    queryFn: async (): Promise<RevenueData> => {
      if (!user) throw new Error('User not authenticated');

      // Get revenue stats
      const { data: stats, error: statsError } = await supabase
        .from('business_revenue_stats')
        .select('*')
        .eq('business_user_id', user.id)
        .order('stat_date', { ascending: false })
        .limit(30);

      if (statsError) throw statsError;

      // Get detailed booking data for offer breakdown
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          total_price,
          status,
          created_at,
          offer_id,
          offer:offers(title)
        `)
        .eq('business_user_id', user.id)
        .eq('status', 'confirmed');

      if (bookingsError) throw bookingsError;

      // Calculate aggregated data
      const today = new Date().toISOString().split('T')[0];
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      const todayRevenue = stats.find(s => s.stat_date === today)?.daily_revenue || 0;
      const weeklyRevenue = stats
        .filter(s => new Date(s.stat_date) >= thisWeekStart)
        .reduce((sum, s) => sum + s.daily_revenue, 0);
      const monthlyRevenue = stats
        .filter(s => new Date(s.stat_date) >= thisMonthStart)
        .reduce((sum, s) => sum + s.daily_revenue, 0);

      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const totalBookings = bookings.length;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Revenue by offer
      const offerRevenue = bookings.reduce((acc, booking) => {
        const offerId = booking.offer_id;
        const offerTitle = booking.offer?.title || 'Offre supprimée';
        
        if (!acc[offerId]) {
          acc[offerId] = {
            offer_id: offerId,
            offer_title: offerTitle,
            total_revenue: 0,
            booking_count: 0,
          };
        }
        
        acc[offerId].total_revenue += booking.total_price || 0;
        acc[offerId].booking_count += 1;
        
        return acc;
      }, {} as Record<string, any>);

      const revenueByOffer = Object.values(offerRevenue)
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue);

      return {
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        weeklyRevenue,
        totalBookings,
        averageBookingValue,
        revenueByOffer,
        dailyStats: stats || [],
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    revenueData: revenueData || {
      totalRevenue: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      totalBookings: 0,
      averageBookingValue: 0,
      revenueByOffer: [],
      dailyStats: [],
    },
    isLoading,
  };
}