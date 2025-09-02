import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Clock, Users } from "lucide-react";

interface PadelBookingFormProps {
  onBookingChange: (data: { participants: number; hours: number; extras: any[] }) => void;
}

export function PadelBookingForm({ onBookingChange }: PadelBookingFormProps) {
  const [participants, setParticipants] = useState(4); // Padel = 4 joueurs par défaut
  const [hours, setHours] = useState(1);

  const handleParticipantsChange = (newCount: number) => {
    const count = Math.max(2, Math.min(newCount, 4)); // Padel: 2-4 joueurs
    setParticipants(count);
    onBookingChange({
      participants: count,
      hours,
      extras: []
    });
  };

  const handleHoursChange = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, 4)); // Max 4 heures
    setHours(count);
    onBookingChange({
      participants,
      hours: count,
      extras: []
    });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users size={20} />
            Configuration Padel
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
                disabled={participants <= 2}
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
                disabled={participants >= 4}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">
                Minimum 2 joueurs
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Maximum 4 joueurs
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
                disabled={hours >= 4}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Prix par terrain et par heure
              </Badge>
            </div>
          </div>

          {/* Info terrain */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="space-y-1">
              <p className="text-xs font-medium text-primary">
                🎾 Terrain de Padel
              </p>
              <p className="text-xs text-primary/80">
                Terrain partagé - Raquettes et balles incluses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}