import { useState } from "react";
import { BowlingBookingForm } from "./BowlingBookingForm";
import { PadelBookingForm } from "./PadelBookingForm";
import { EscapeGameBookingForm } from "./EscapeGameBookingForm";
import { BillardBookingForm } from "./BillardBookingForm";

interface ActivityBookingManagerProps {
  category: string;
  maxParticipants?: number;
  onBookingDataChange: (data: {
    participants: number;
    units: number;
    unitType: string;
    extras: any[];
  }) => void;
}

export function ActivityBookingManager({ 
  category, 
  maxParticipants, 
  onBookingDataChange 
}: ActivityBookingManagerProps) {
  const [bookingData, setBookingData] = useState({
    participants: 1,
    units: 1,
    unitType: 'participant',
    extras: []
  });

  const handleBookingChange = (data: any) => {
    let unitType = 'participant';
    let units = 1;

    // Determine unit type and count based on activity
    switch (category.toLowerCase()) {
      case 'bowling':
        unitType = 'game';
        units = data.games || 1;
        break;
      case 'padel':
        unitType = 'hour';
        units = data.hours || 1;
        break;
      case 'escape game':
        unitType = 'session';
        units = data.sessions || 1;
        break;
      case 'billard':
        unitType = 'hour';
        units = data.hours || 1;
        break;
      default:
        unitType = 'participant';
        units = 1;
    }

    const newBookingData = {
      participants: data.participants,
      units,
      unitType,
      extras: data.extras || []
    };

    setBookingData(newBookingData);
    onBookingDataChange(newBookingData);
  };

  // Render the appropriate booking form based on category
  const renderBookingForm = () => {
    switch (category.toLowerCase()) {
      case 'bowling':
        return (
          <BowlingBookingForm
            maxParticipants={maxParticipants}
            onBookingChange={handleBookingChange}
          />
        );
      case 'padel':
        return (
          <PadelBookingForm
            onBookingChange={handleBookingChange}
          />
        );
      case 'escape game':
        return (
          <EscapeGameBookingForm
            maxParticipants={maxParticipants}
            onBookingChange={handleBookingChange}
          />
        );
      case 'billard':
        return (
          <BillardBookingForm
            maxParticipants={maxParticipants}
            onBookingChange={handleBookingChange}
          />
        );
      default:
        // Fallback: generic participant selector
        return (
          <div className="p-4 text-center text-muted-foreground">
            Formulaire de réservation générique pour {category}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderBookingForm()}
    </div>
  );
}