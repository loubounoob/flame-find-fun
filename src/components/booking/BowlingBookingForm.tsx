import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Users, Gamepad2 } from "lucide-react";

interface BowlingBookingFormProps {
  maxParticipants?: number;
  onBookingChange: (data: { participants: number; games: number; extras: any[] }) => void;
}

export function BowlingBookingForm({ maxParticipants = 8, onBookingChange }: BowlingBookingFormProps) {
  const [participants, setParticipants] = useState(1);
  const [games, setGames] = useState(1);
  const [shoesNeeded, setShoesNeeded] = useState(participants);

  const handleParticipantsChange = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, maxParticipants));
    setParticipants(count);
    setShoesNeeded(count); // Par défaut, tout le monde a besoin de chaussures
    onBookingChange({
      participants: count,
      games,
      extras: [{ type: 'shoes', quantity: shoesNeeded, price: 3 }]
    });
  };

  const handleGamesChange = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, 10)); // Max 10 parties
    setGames(count);
    onBookingChange({
      participants,
      games: count,
      extras: [{ type: 'shoes', quantity: shoesNeeded, price: 3 }]
    });
  };

  const handleShoesChange = (newCount: number) => {
    const count = Math.max(0, Math.min(newCount, participants));
    setShoesNeeded(count);
    onBookingChange({
      participants,
      games,
      extras: [{ type: 'shoes', quantity: count, price: 3 }]
    });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 size={20} />
            Configuration Bowling
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
                Maximum {maxParticipants} joueurs par piste
              </Badge>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Gamepad2 size={16} />
              Nombre de parties
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleGamesChange(games - 1)}
                disabled={games <= 1}
                className="h-10 w-10"
              >
                <Minus size={16} />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary">{games}</div>
                <div className="text-xs text-muted-foreground">
                  partie{games > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleGamesChange(games + 1)}
                disabled={games >= 10}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                ~15 minutes par partie et par joueur
              </Badge>
            </div>
          </div>

          {/* Chaussures */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Location de chaussures
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShoesChange(shoesNeeded - 1)}
                disabled={shoesNeeded <= 0}
                className="h-10 w-10"
              >
                <Minus size={16} />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-xl font-semibold text-foreground">{shoesNeeded}</div>
                <div className="text-xs text-muted-foreground">
                  paire{shoesNeeded > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShoesChange(shoesNeeded + 1)}
                disabled={shoesNeeded >= participants}
                className="h-10 w-10"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                3€ par paire
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}