import { cn } from "@/lib/utils";
import { Home, MapPin, User, Search, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

export function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-card/95 backdrop-blur-md border-r border-border/50 z-40">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
              FlameUp
            </h1>
            <p className="text-sm text-muted-foreground">Lyon • Étudiant</p>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                    "text-left w-full",
                    isActive
                      ? "bg-gradient-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "transition-transform duration-300",
                      isActive && "scale-110"
                    )} 
                  />
                  <span 
                    className={cn(
                      "font-medium transition-all duration-300",
                      isActive ? "opacity-100" : "opacity-70"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav 
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50",
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
    </>
  );
}