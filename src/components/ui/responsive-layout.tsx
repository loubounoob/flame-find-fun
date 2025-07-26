import { ReactNode } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { DesktopNav } from "@/components/ui/desktop-nav";

interface ResponsiveLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export function ResponsiveLayout({ 
  children, 
  showBottomNav = true, 
  className = "" 
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Main Content */}
      <div className={`desktop-content ${className}`}>
        {children}
      </div>
      
      {/* Mobile Navigation */}
      {showBottomNav && <BottomNav className="mobile-only" />}
    </div>
  );
}