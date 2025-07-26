import Home from "./Home";
import { BottomNav } from "@/components/ui/bottom-nav";
import { DesktopNav } from "@/components/ui/desktop-nav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Main Content */}
      <div className="desktop-content">
        <Home />
      </div>
      
      {/* Mobile Navigation */}
      <BottomNav className="mobile-only" />
    </div>
  );
};

export default Index;
