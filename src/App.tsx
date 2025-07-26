import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Map from "./pages/Map";
import Flames from "./pages/Flames";
import Profile from "./pages/Profile";
import OfferDetail from "./pages/OfferDetail";
import Booking from "./pages/Booking";
import BookingForm from "./pages/BookingForm";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProfileEdit from "./pages/ProfileEdit";
import Subscription from "./pages/Subscription";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import BusinessDashboard from "./pages/BusinessDashboard";
import { BottomNav } from "@/components/ui/bottom-nav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/map" element={<Map />} />
              <Route path="/flames" element={<Flames />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/offer/:id" element={<OfferDetail />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/booking/:id" element={<BookingForm />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/business-dashboard" element={<BusinessDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
