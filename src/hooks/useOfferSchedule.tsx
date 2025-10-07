import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OfferSchedule {
  id: string;
  offer_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface RecurringPromotion {
  id: string;
  offer_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  discount_percentage: number;
  is_active: boolean;
}

interface ScheduleCheckResult {
  isWithinSchedule: boolean;
  isPromoted: boolean;
  discountPercentage: number;
  scheduleInfo: string;
  promotionInfo?: string;
}

// Fonction pour formater l'heure sans les secondes
const formatTime = (time: string) => {
  return time.substring(0, 5); // Prend seulement HH:MM
};

export const useOfferSchedule = (offerId: string) => {
  const { data: schedules } = useQuery({
    queryKey: ["offer-schedules", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_schedules")
        .select("*")
        .eq("offer_id", offerId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data as OfferSchedule[];
    },
  });

  const { data: promotions } = useQuery({
    queryKey: ["recurring-promotions", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_promotions")
        .select("*")
        .eq("offer_id", offerId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data as RecurringPromotion[];
    },
  });

  const checkSchedule = (date: Date, time?: string): ScheduleCheckResult => {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const timeToCheck = time || date.toTimeString().slice(0, 5);

    // Si pas d'horaires définis, considérer disponible 24/7
    const isWithinSchedule = !schedules || schedules.length === 0 || schedules.some(schedule => {
      const scheduleStart = formatTime(schedule.start_time);
      const scheduleEnd = formatTime(schedule.end_time);
      return schedule.days_of_week.includes(dayOfWeek) &&
        timeToCheck >= scheduleStart &&
        timeToCheck <= scheduleEnd;
    });

    // Vérifier les promotions seulement si dans les horaires
    let isPromoted = false;
    let discountPercentage = 0;
    let promotionInfo = "";

    if (isWithinSchedule && promotions && promotions.length > 0) {
      const activePromo = promotions.find(promo => {
        const promoStart = formatTime(promo.start_time);
        const promoEnd = formatTime(promo.end_time);
        return promo.days_of_week.includes(dayOfWeek) &&
          timeToCheck >= promoStart &&
          timeToCheck <= promoEnd;
      });

      if (activePromo) {
        isPromoted = true;
        discountPercentage = activePromo.discount_percentage;
        promotionInfo = `-${discountPercentage}% de réduction`;
      }
    }

    // Générer le message d'horaires
    let scheduleInfo = "";
    if (schedules && schedules.length > 0) {
      const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const groupedSchedules = schedules.reduce((acc, schedule) => {
        const key = `${schedule.start_time}-${schedule.end_time}`;
        if (!acc[key]) acc[key] = [];
        schedule.days_of_week.forEach(day => acc[key].push(day));
        return acc;
      }, {} as Record<string, number[]>);

      scheduleInfo = Object.entries(groupedSchedules)
        .map(([timeRange, days]) => {
          const sortedDays = [...new Set(days)].sort((a, b) => a - b);
          const dayNames = sortedDays.map(d => daysMap[d]).join(", ");
          const [start, end] = timeRange.split("-");
          return `${dayNames} : ${formatTime(start)} - ${formatTime(end)}`;
        })
        .join(" | ");
    } else {
      scheduleInfo = "Horaires non renseignés";
    }

    return {
      isWithinSchedule,
      isPromoted,
      discountPercentage,
      scheduleInfo,
      promotionInfo: isPromoted ? promotionInfo : undefined,
    };
  };

  return {
    schedules: schedules || [],
    promotions: promotions || [],
    checkSchedule,
  };
};
