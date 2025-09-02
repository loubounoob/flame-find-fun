import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Users, Puzzle } from "lucide-react";

interface EscapeGameBookingFormProps {
  maxParticipants?: number;
  onBookingChange: (data: { participants: number; sessions: number; extras: any[] }) => void;
}

export function EscapeGameBookingForm({ maxParticipants = 6, onBookingChange }: EscapeGameBookingFormProps) {
  const [participants, setParticipants] = useState(4);
  const sessions = 1; // Une session par réservation pour escape game

  const handleParticipantsChange = (newCount: number) => {
    const count = Math.max(2, Math.min(newCount, maxParticipants));
    setParticipants(count);
    onBookingChange({
      participants: count,
      sessions,
      extras: []
    });
  };

  const getDifficultyBadge = () => {
    if (participants <= 3) return { text: "Défi Expert", variant: "destructive" as const };
    if (participants <= 4) return { text: "Difficulté Normale", variant: "secondary" as const };
    return { text: "Mode Facile", variant: "outline" as const };
  };

  const difficultyInfo = getDifficultyBadge();

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Puzzle size={20} />
            Configuration Escape Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Participants */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Users size={16} />
              Nombre de participants
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
                  participant{participants > 1 ? 's' : ''}
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
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">
                Minimum 2 participants
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Maximum {maxParticipants} participants
              </Badge>
            </div>
          </div>

          {/* Difficulté selon le nombre */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Niveau de difficulté
            </Label>
            <div className="text-center">
              <Badge variant={difficultyInfo.variant} className="text-sm py-2 px-4">
                {difficultyInfo.text}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              La difficulté s'adapte automatiquement selon le nombre de participants
            </p>
          </div>

          {/* Info session */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="space-y-1">
              <p className="text-xs font-medium text-primary">
                🔍 Session d'Escape Game
              </p>
              <p className="text-xs text-primary/80">
                Durée: 60 minutes - Briefing et débriefing inclus
              </p>
            </div>
          </div>

          {/* Conseils */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-700">
                💡 Conseils
              </p>
              <p className="text-xs text-amber-600">
                4-5 participants = équilibre idéal entre challenge et collaboration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}