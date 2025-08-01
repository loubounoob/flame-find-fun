import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Heart, Calendar, MapPin, Crown, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";

const notifications = [
  {
    id: 1,
    type: "flame",
    title: "Nouvelle flamme reçue !",
    message: "Ton offre \"Bowling Party\" a reçu une flamme de Marie L.",
    time: "Il y a 5 minutes",
    read: false,
    icon: Heart,
    color: "flame"
  },
  {
    id: 2,
    type: "booking",
    title: "Réservation confirmée",
    message: "Ta réservation pour le Laser Game Epic est confirmée pour demain 14h30.",
    time: "Il y a 1 heure",
    read: false,
    icon: Calendar,
    color: "success"
  },
  {
    id: 3,
    type: "offer",
    title: "Nouvelle offre près de toi !",
    message: "Escape Game Mystery disponible à 500m de ta position.",
    time: "Il y a 2 heures",
    read: true,
    icon: MapPin,
    color: "primary"
  },
  {
    id: 4,
    type: "premium",
    title: "Avantage Premium",
    message: "Accès prioritaire activé pour l'événement spécial de ce weekend !",
    time: "Hier",
    read: true,
    icon: Crown,
    color: "secondary"
  },
  {
    id: 5,
    type: "system",
    title: "Mise à jour Ludigo",
    message: "Découvre les nouvelles fonctionnalités dans la version 2.1 !",
    time: "Il y a 2 jours",
    read: true,
    icon: Bell,
    color: "info"
  }
];

export default function Notifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: true,
    newOffers: true,
    flames: true,
    bookings: true,
    premium: true
  });

  const [notificationList, setNotificationList] = useState(
    notifications.sort((a, b) => {
      // Sort by read status first (unread first), then by time (most recent first)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      // For time comparison, we'll use a simple heuristic based on the time strings
      const timeToMinutes = (timeStr) => {
        if (timeStr.includes('minutes')) return parseInt(timeStr);
        if (timeStr.includes('heure')) return parseInt(timeStr) * 60;
        if (timeStr.includes('Hier')) return 24 * 60;
        if (timeStr.includes('jours')) return parseInt(timeStr) * 24 * 60;
        return 0;
      };
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    })
  );

  const markAsRead = (id: number) => {
    setNotificationList(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotificationList(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notificationList.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-poppins font-bold text-foreground">
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
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Notification Settings */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Paramètres de notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Notifications push</h4>
                <p className="text-sm text-muted-foreground">Recevoir des notifications sur ton téléphone</p>
              </div>
              <Switch 
                checked={notificationSettings.push}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, push: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Notifications email</h4>
                <p className="text-sm text-muted-foreground">Recevoir un résumé par email</p>
              </div>
              <Switch 
                checked={notificationSettings.email}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, email: checked }))
                }
              />
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <h4 className="font-medium text-foreground">Types de notifications</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Nouvelles offres près de moi</span>
                <Switch 
                  checked={notificationSettings.newOffers}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, newOffers: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Flammes reçues</span>
                <Switch 
                  checked={notificationSettings.flames}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, flames: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Réservations et rappels</span>
                <Switch 
                  checked={notificationSettings.bookings}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, bookings: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Avantages Premium</span>
                <Switch 
                  checked={notificationSettings.premium}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, premium: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          <h3 className="text-lg font-poppins font-semibold text-foreground">
            Récentes
          </h3>
          
          {notificationList.map((notification) => {
            const Icon = notification.icon;
            
            return (
              <Card 
                key={notification.id}
                className={`bg-gradient-card border-border/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  !notification.read ? 'border-primary/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
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

        {notificationList.length === 0 && (
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
    </div>
  );
}