import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Star, X } from "lucide-react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Booking() {
  const { user } = useAuth();
  const { bookings, isLoading, cancelBooking } = useBookings();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground">Connectez-vous pour voir vos réservations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
            Mes Réservations
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement de vos réservations...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune réservation pour le moment.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="bg-gradient-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-lg flex-shrink-0 bg-cover bg-center" 
                         style={{ backgroundImage: booking.offer?.image_url ? `url(${booking.offer.image_url})` : undefined }}>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{booking.offer?.title}</h3>
                          <p className="text-sm text-muted-foreground">{booking.offer?.category}</p>
                        </div>
                        <Badge 
                          variant={booking.status === "confirmed" ? "default" : "secondary"}
                          className={booking.status === "confirmed" ? "bg-gradient-success text-white" : ""}
                        >
                          {booking.status === "confirmed" ? "Confirmé" : booking.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(booking.booking_date).toLocaleDateString('fr-FR')} à {new Date(booking.booking_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{booking.offer?.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{booking.participant_count} participant{booking.participant_count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Réservé le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        {booking.status === "confirmed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => cancelBooking(booking.id)}
                          >
                            <X size={14} className="mr-1" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}