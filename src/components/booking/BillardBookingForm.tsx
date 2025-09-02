import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Clock, Users, Circle } from "lucide-react";

interface BillardBookingFormProps {
  maxParticipants?: number;
  onBookingChange: (data: { participants: number; hours: number; extras: any[] }) => void;
}

export function BillardBookingForm({ maxParticipants = 4, onBookingChange }: BillardBookingFormProps) {
  const [participants, setParticipants] = useState(2);
  const [hours, setHours] = useState(1);

  const handleParticipantsChange = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, maxParticipants));
    setParticipants(count);
    onBookingChange({
      participants: count,
      hours,
      extras: []
    });
  };

  const handleHoursChange = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, 8)); // Max 8 heures
    setHours(count);
    onBookingChange({
      participants,
      hours: count,
      extras: []
    });
  };

  const getGameMode = () => {
    if (participants === 1) return "Entraînement solo";
    if (participants === 2) return "Duel classique";
    if (participants === 3) return "Partie à 3 (rotation)";
    return "Partie en équipes (2v2)";
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Circle size={20} />
            Configuration Billard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Participants */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Users size={16} />
              Nombre de joueurs
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleParticipantsChange(participants - 1)}
                disabled={participants <= 1}
                className="h-10 w-10"
              >
                <Minus size={16} />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary">{participants}</div>
                <div className="text-xs text-muted-foreground">
                  joueur{participants > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleParticipantsChange(participants + 1)}
                disabled={participants >= maxParticipants}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                {getGameMode()}
              </Badge>
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Clock size={16} />
              Durée de réservation
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleHoursChange(hours - 1)}
                disabled={hours <= 1}
                className="h-10 w-10"
              >
                <Minus size={16} />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary">{hours}</div>
                <div className="text-xs text-muted-foreground">
                  heure{hours > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleHoursChange(hours + 1)}
                disabled={hours >= 8}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Prix par table et par heure
              </Badge>
            </div>
          </div>

          {/* Type de billard */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Type de billard
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="secondary" className="justify-center py-2">
                Billard Français
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Pool Américain
              </Badge>
            </div>
          </div>

          {/* Info table */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="space-y-1">
              <p className="text-xs font-medium text-primary">
                🎱 Table de Billard
              </p>
              <p className="text-xs text-primary/80">
                Queues et craies incluses - Maximum {maxParticipants} joueurs par table
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}