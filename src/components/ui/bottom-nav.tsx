import { cn } from "@/lib/utils";
import { Home, MapPin, User, Search, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavProps {
  className?: string;
}

const navItems = [
  { 
    icon: Home, 
    label: "Accueil", 
    path: "/" 
  },
  { 
    icon: MapPin, 
    label: "Carte", 
    path: "/map" 
  },
  { 
    icon: Heart, 
    label: "Réservations", 
    path: "/booking" 
  },
  { 
    icon: User, 
    label: "Profil", 
    path: "/profile" 
  },
];

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Modifier la navigation pour les comptes entreprise
  if (user?.user_metadata?.account_type === "business") {
    const businessNavItems = [
      { 
        icon: Home, 
        label: "Accueil", 
        path: "/" 
      },
      { 
        icon: User, 
        label: "Business", 
        path: "/business-dashboard" 
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
        <div className="flex items-center justify-around max-w-md mx-auto">
          {businessNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center",
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
                "flex flex-col items-center justify-center",
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