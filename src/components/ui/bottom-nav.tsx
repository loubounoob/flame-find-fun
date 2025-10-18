import { cn } from "@/lib/utils";
import { Home, MapPin, User, Search, Heart, BarChart3, Bell, Map } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const navItems = [
    { 
      icon: Home, 
      label: t('navigation.home'), 
      path: "/" 
    },
    { 
      icon: MapPin, 
      label: t('navigation.map'), 
      path: "/map" 
    },
    { 
      icon: Heart, 
      label: "Réservations", 
      path: "/booking" 
    },
    { 
      icon: User, 
      label: t('navigation.profile'), 
      path: "/profile" 
    },
  ];
  
  // Récupérer le nombre de notifications non lues
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 0, // Les données sont immédiatement considérées comme obsolètes
  });
  
  // Modifier la navigation pour les comptes entreprise
  if (user?.user_metadata?.account_type === "business") {
    const businessNavItems = [
      { 
        icon: Home, 
        label: t('navigation.home'), 
        path: "/" 
      },
      { 
        icon: BarChart3, 
        label: t('navigation.dashboard'), 
        path: "/business-dashboard" 
      },
      { 
        icon: Map, 
        label: t('navigation.map'), 
        path: "/map" 
      },
      { 
        icon: User, 
        label: t('navigation.profile'), 
        path: "/business-profile" 
      },
    ];

    return (
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-card/95 backdrop-blur-md border-t border-border/50",
          "px-2 py-2 safe-area-inset-bottom",
          className
        )}
      >
        <div className="flex items-center justify-around max-w-md mx-auto grid-cols-4">{/* Added grid-cols-4 for spacing */}
          {businessNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center relative",
                  "px-3 py-2 rounded-xl transition-all duration-300",
                  "min-w-[60px]",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon 
                  size={20} 
                  className={cn(
                    "mb-1 transition-transform duration-300",
                    isActive && "scale-110"
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs font-medium transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-md border-t border-border/50",
        "px-2 py-2 safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center relative",
                "px-3 py-2 rounded-xl transition-all duration-300",
                "min-w-[60px]",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-lg scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "mb-1 transition-transform duration-300",
                  isActive && "scale-110"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}