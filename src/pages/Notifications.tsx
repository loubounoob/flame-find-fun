import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Heart, Calendar, MapPin, Crown, Trash2, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RatingModal } from "@/components/RatingModal";

// Removed default notifications - only show real notifications from database

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOfferId, setRatingOfferId] = useState<string | null>(null);
  
  // Removed notification settings - no longer needed

  // Récupérer les notifications réelles de la base de données
  const { data: realNotifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Utiliser un distinct pour éviter les doublons basés sur le contenu
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Éliminer les doublons potentiels basés sur le titre, le message et la date (à la minute près)
      const uniqueNotifications = (data || []).filter((notif, index, array) => {
        const notifDate = new Date(notif.created_at);
        notifDate.setSeconds(0, 0); // Ignorer les secondes et millisecondes
        
        return !array.slice(0, index).some(prevNotif => {
          const prevDate = new Date(prevNotif.created_at);
          prevDate.setSeconds(0, 0);
          
          return (
            prevNotif.title === notif.title &&
            prevNotif.message === notif.message &&
            prevNotif.type === notif.type &&
            prevDate.getTime() === notifDate.getTime()
          );
        });
      });
      
      return uniqueNotifications;
    },
    enabled: !!user,
  });

  // À partir de maintenant, nous utilisons useEffect pour marquer les notifications comme lues après la visite
  useEffect(() => {
    // Marquer toutes les notifications comme lues après la visite de la page
    const markNotificationsAsReadOnVisit = async () => {
      if (user && realNotifications.some(n => !n.read)) {
        // Attendre un peu pour permettre à l'utilisateur de voir les notifications
        setTimeout(async () => {
          await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);
          refetchNotifications();
        }, 1000); // Marquer comme lu après 1 seconde de consultation
      }
    };

    markNotificationsAsReadOnVisit();
  }, [user, realNotifications]);

  // Only use real notifications from database
  const allNotifications = realNotifications.map(notif => ({
    id: parseInt(notif.id.slice(-6), 16), // Convert UUID to number for compatibility
    type: notif.type,
    title: notif.title,
    message: notif.message,
    time: new Date(notif.created_at).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }),
    read: notif.read,
    icon: notif.type === 'booking_confirmation' ? Calendar :
          notif.type === 'new_booking' ? Bell :
          notif.type === 'rating_request' ? Star : Heart,
    color: notif.type === 'booking_confirmation' ? 'success' :
           notif.type === 'new_booking' ? 'primary' :
           notif.type === 'rating_request' ? 'warning' : 'flame',
    metadata: notif.metadata
  })).sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  const markAsRead = async (id: number, metadata?: any) => {
    // Récupérer la notification réelle pour accéder au type
    const realNotif = realNotifications.find(n => parseInt(n.id.slice(-6), 16) === id);
    
    // Si c'est une notification de demande d'évaluation, ouvrir le modal
    if (metadata?.requires_rating && metadata?.offer_id) {
      setRatingOfferId(metadata.offer_id);
      setShowRatingModal(true);
    }
    
    // Redirection pour "Nouvelle réservation !" (activités)
    if (realNotif?.type === 'new_booking') {
      navigate('/business-dashboard?tab=bookings');
    }
    
    // Redirection pour "Réservation confirmée" (clients uniquement)
    if (realNotif?.type === 'booking_confirmation' && user) {
      // Vérifier si l'utilisateur est un client (n'a pas d'offres)
      // @ts-ignore - Type instantiation issue with Supabase types
      const result = await supabase
        .from('offers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const isClient = !result.data;
      
      if (isClient) {
        // C'est un client, rediriger vers la page réservations
        navigate('/booking');
      }
    }

    // Marquer comme lu dans la base de données si c'est une vraie notification
    if (user && realNotif && !realNotif.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", realNotif.id);
      refetchNotifications();
    }
  };

  const deleteNotification = async (id: number) => {
    // Delete from database
    if (user && realNotifications.some(n => parseInt(n.id.slice(-6), 16) === id)) {
      const realNotif = realNotifications.find(n => parseInt(n.id.slice(-6), 16) === id);
      if (realNotif) {
        await supabase
          .from("notifications")
          .delete()
          .eq("id", realNotif.id);
        refetchNotifications();
      }
    }
  };

  const markAllAsRead = async () => {
    // Mark all real notifications as read
    if (user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      refetchNotifications();
    }
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-poppins font-bold text-foreground">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs px-2 py-1 h-auto whitespace-nowrap">
              <span className="hidden sm:inline">Tout marquer comme lu</span>
              <span className="sm:hidden">Marquer tout</span>
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-6">

        {/* Notifications List */}
        <div className="space-y-4">
          <h3 className="text-lg font-poppins font-semibold text-foreground">
            Récentes
          </h3>
          
          {allNotifications.map((notification) => {
            const Icon = notification.icon;
            
            return (
              <Card 
                key={notification.id}
                className={`bg-gradient-card border-border/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  !notification.read ? 'border-primary/50' : ''
                }`}
                onClick={() => markAsRead(notification.id, notification.metadata)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-${notification.color} shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-foreground text-sm">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.read && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                              Nouveau
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-2">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune notification
            </h3>
            <p className="text-muted-foreground">
              Tu recevras tes notifications ici dès qu'il y en aura !
            </p>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Modal d'évaluation */}
      {showRatingModal && ratingOfferId && (
        <RatingModal
          offerId={ratingOfferId}
          onClose={() => {
            setShowRatingModal(false);
            setRatingOfferId(null);
          }}
          onRatingSubmitted={() => {
            refetchNotifications();
          }}
        />
      )}
    </div>
  );
}