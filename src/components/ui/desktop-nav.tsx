import { cn } from "@/lib/utils";
import { Home, MapPin, User, Search, Heart, Settings, Bell, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface DesktopNavProps {
  className?: string;
}

const navItems = [
  { 
    icon: Home, 
    label: "Accueil", 
    path: "/" 
  },
  { 
    icon: Search, 
    label: "Explorer", 
    path: "/explore" 
  },
  { 
    icon: MapPin, 
    label: "Carte", 
    path: "/map" 
  },
  { 
    icon: Heart, 
    label: "Flammes", 
    path: "/flames" 
  },
  { 
    icon: User, 
    label: "Profil", 
    path: "/profile" 
  },
];

const secondaryItems = [
  { 
    icon: Bell, 
    label: "Notifications", 
    path: "/notifications",
    badge: 3
  },
  { 
    icon: Settings, 
    label: "Paramètres", 
    path: "/settings" 
  },
  { 
    icon: Star, 
    label: "Abonnement", 
    path: "/subscription" 
  },
];

export function DesktopNav({ className }: DesktopNavProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav 
      className={cn(
        "desktop-nav",
        className
      )}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-poppins font-bold text-gradient-primary mb-1">
          FlameUp
        </h1>
        <p className="text-sm text-muted-foreground">Lyon • Étudiant</p>
      </div>

      {/* Main Navigation */}
      <div className="space-y-2 mb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                "hover:bg-muted/50 hover:text-foreground",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "transition-transform duration-300",
                  isActive && "scale-110"
                )} 
              />
              <span className="font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 mb-4" />

      {/* Secondary Navigation */}
      <div className="space-y-2 mb-6">
        {secondaryItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative",
                "hover:bg-muted/50 hover:text-foreground",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground"
              )}
            >
              <Icon 
                size={18} 
                className={cn(
                  "transition-transform duration-300",
                  isActive && "scale-110"
                )} 
              />
              <span className="font-medium text-sm">
                {item.label}
              </span>
              {item.badge && (
                <Badge className="ml-auto h-5 w-5 rounded-full bg-flame text-white text-xs p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Section */}
      {user && (
        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <User size={16} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email?.split('@')[0] || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground">
                Connecté
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}