import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ScheduleManagerProps {
  offerId: string;
  businessUserId: string;
  schedules: Schedule[];
  onSchedulesUpdated: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export default function ScheduleManager({ offerId, businessUserId, schedules, onSchedulesUpdated }: ScheduleManagerProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddSchedule = async () => {
    if (selectedDays.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un jour",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Erreur",
        description: "L'heure de fin doit être après l'heure de début",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("offer_schedules").insert({
        offer_id: offerId,
        business_user_id: businessUserId,
        days_of_week: selectedDays,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Horaire ajouté avec succès",
      });

      setSelectedDays([]);
      setStartTime("");
      setEndTime("");
      onSchedulesUpdated();
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'horaire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from("offer_schedules")
        .delete()
        .eq("id", scheduleId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Horaire supprimé",
      });
      onSchedulesUpdated();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'horaire",
        variant: "destructive",
      });
    }
  };

  const getDayLabel = (day: number) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || "";
  };

  return (
    <div className="space-y-6">
      {/* Liste des horaires existants */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          <Label>Créneaux configurés</Label>
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-primary/30 transition-colors bg-card/50"
            >
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  {schedule.days_of_week.map(day => getDayLabel(day)).join(", ")}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteSchedule(schedule.id)}
                className="hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <Label>Jours de la semaine</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <label
                  htmlFor={`day-${day.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-time">Heure de début</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-time">Heure de fin</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleAddSchedule}
          disabled={isSubmitting}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un créneau
        </Button>
      </div>
    </div>
  );
}
