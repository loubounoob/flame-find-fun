import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import ScheduleManager from "./ScheduleManager";

interface OfferScheduleCardProps {
  offer: any;
  businessUserId: string;
}

export default function OfferScheduleCard({ offer, businessUserId }: OfferScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["offer-schedules", offer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_schedules")
        .select("*")
        .eq("offer_id", offer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getDayLabel = (day: number) => {
    const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return daysMap[day] || "";
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{offer.title}</CardTitle>
            {schedules.length > 0 ? (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {schedules.length} créneau{schedules.length > 1 ? "x" : ""}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {schedules[0].days_of_week.map(d => getDayLabel(d)).join(", ")}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="mt-2 text-xs">
                Aucun horaire défini
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <ScheduleManager
            offerId={offer.id}
            businessUserId={businessUserId}
            schedules={schedules}
            onSchedulesUpdated={refetch}
          />
        </CardContent>
      )}
    </Card>
  );
}
