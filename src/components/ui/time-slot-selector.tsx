import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import { Clock, Calendar, Plus } from "lucide-react";

interface TimeSlot {
  id: string;
  label: string;
  time: string;
  date?: string;
  isCustom?: boolean;
}

interface TimeSlotSelectorProps {
  selectedSlot: string;
  onSlotSelect: (slotId: string) => void;
  onCustomSlot?: (time: string, date: string) => void;
}

export function TimeSlotSelector({ selectedSlot, onSlotSelect, onCustomSlot }: TimeSlotSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [customDate, setCustomDate] = useState("");

  // Créneaux par défaut intelligents
  const getSmartTimeSlots = (): TimeSlot[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const slots: TimeSlot[] = [];

    // Si c'est avant 16h, proposer des créneaux aujourd'hui
    if (currentHour < 16) {
      slots.push(
        { id: "today-18", label: "Ce soir (18h)", time: "18:00", date: today },
        { id: "today-19", label: "Ce soir (19h)", time: "19:00", date: today },
        { id: "today-20", label: "Ce soir (20h)", time: "20:00", date: today }
      );
    }
    // Si c'est entre 16h et 18h, proposer des créneaux plus tard dans la soirée
    else if (currentHour < 18) {
      const nextHour = currentHour + 2;
      if (nextHour <= 21) {
        slots.push({ 
          id: `today-${nextHour}`, 
          label: `Ce soir (${nextHour}h)`, 
          time: `${nextHour}:00`, 
          date: today 
        });
      }
      slots.push(
        { id: "today-20", label: "Ce soir (20h)", time: "20:00", date: today },
        { id: "today-21", label: "Ce soir (21h)", time: "21:00", date: today }
      );
    }

    // Toujours proposer demain
    slots.push(
      { id: "tomorrow-18", label: "Demain (18h)", time: "18:00", date: tomorrow },
      { id: "tomorrow-19", label: "Demain (19h)", time: "19:00", date: tomorrow },
      { id: "tomorrow-20", label: "Demain (20h)", time: "20:00", date: tomorrow }
    );

    // Week-end spécial
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Vendredi ou Samedi
      const weekend = new Date(now.getTime() + (dayOfWeek === 5 ? 24 : 0) * 60 * 60 * 1000);
      const weekendDate = weekend.toISOString().split('T')[0];
      
      slots.push(
        { id: "weekend-afternoon", label: "Après-midi WE (14h)", time: "14:00", date: weekendDate },
        { id: "weekend-evening", label: "Soirée WE (21h)", time: "21:00", date: weekendDate }
      );
    }

    return slots;
  };

  const timeSlots = getSmartTimeSlots();

  const handleCustomSubmit = () => {
    if (customTime && customDate && onCustomSlot) {
      onCustomSlot(customTime, customDate);
      setShowCustom(false);
      setCustomTime("");
      setCustomDate("");
    }
  };

  const formatSlotDisplay = (slot: TimeSlot) => {
    const slotDate = new Date(slot.date || new Date());
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let dateLabel = "";
    if (slot.date === today.toISOString().split('T')[0]) {
      dateLabel = "Aujourd'hui";
    } else if (slot.date === tomorrow.toISOString().split('T')[0]) {
      dateLabel = "Demain";
    } else {
      dateLabel = slotDate.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    return `${dateLabel} à ${slot.time}`;
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={20} />
          Choisir un créneau
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Créneaux suggérés */}
        <div className="space-y-2">
          <Label>Créneaux suggérés :</Label>
          <div className="grid gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSlotSelect(slot.id)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  selectedSlot === slot.id
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-accent/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{slot.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatSlotDisplay(slot)}
                    </div>
                  </div>
                  {selectedSlot === slot.id && (
                    <Badge variant="default" className="text-xs">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Créneau personnalisé */}
        <div className="pt-4 border-t border-border/50">
          {!showCustom ? (
            <Button
              variant="outline"
              onClick={() => setShowCustom(true)}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Créneau personnalisé
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} />
                  <Label>Créneau personnalisé</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom-date">Date</Label>
                    <Input
                      id="custom-date"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-time">Heure</Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCustomSubmit}
                    disabled={!customTime || !customDate}
                    className="flex-1"
                  >
                    Confirmer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustom(false);
                      setCustomTime("");
                      setCustomDate("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}