import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Calendar, MapPin, Users, Clock, ChevronLeft } from "lucide-react";
import { useBusinessBookings } from "@/hooks/useBusinessBookings";
import { format, isToday, isThisWeek, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BusinessBookings() {
  const { bookings, isLoading } = useBusinessBookings();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos réservations...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'cancelled': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'cancelled': return 'Annulée';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  // Organiser les réservations par période
  const todayBookings = bookings.filter(booking => 
    isToday(new Date(booking.booking_date)) && booking.status !== 'cancelled'
  );
  
  const thisWeekBookings = bookings.filter(booking => 
    isThisWeek(new Date(booking.booking_date)) && 
    !isToday(new Date(booking.booking_date)) && 
    booking.status !== 'cancelled'
  );
  
  const futureBookings = bookings.filter(booking => 
    isFuture(new Date(booking.booking_date)) && 
    !isThisWeek(new Date(booking.booking_date)) && 
    booking.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(booking => 
    !isFuture(new Date(booking.booking_date)) && 
    !isToday(new Date(booking.booking_date))
  );

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {booking.offer?.image_url && (
            <img
              src={booking.offer.image_url}
              alt={booking.offer?.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {booking.offer?.title}
              </h3>
              <Badge variant={getStatusBadgeVariant(booking.status)} className="text-xs">
                {getStatusText(booking.status)}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>
                  {format(new Date(booking.booking_date), 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span className="truncate">{booking.offer?.location}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{booking.participant_count} personne(s)</span>
              </div>

              {booking.business && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    Chez {booking.business.business_name || 
                      `${booking.business.first_name || ''} ${booking.business.last_name || ''}`.trim() || 
                      'Entreprise'}
                  </span>
                </div>
              )}
            </div>

            {booking.notes && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Notes:</strong> {booking.notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BookingSection = ({ title, bookings, icon: Icon }: { title: string; bookings: any[]; icon: any }) => {
    if (bookings.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge variant="secondary">{bookings.length}</Badge>
        </div>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
            Mes réservations
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {bookings.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore fait de réservation en tant que client.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <BookingSection
              title="Aujourd'hui"
              bookings={todayBookings}
              icon={Clock}
            />
            
            <BookingSection
              title="Cette semaine"
              bookings={thisWeekBookings}
              icon={Calendar}
            />
            
            <BookingSection
              title="Plus tard"
              bookings={futureBookings}
              icon={Calendar}
            />
            
            <BookingSection
              title="Historique"
              bookings={pastBookings}
              icon={Calendar}
            />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}