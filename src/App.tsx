import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import OfferDetail from "./pages/OfferDetail";
import Booking from "./pages/Booking";
import BookingForm from "./pages/BookingForm";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProfileEdit from "./pages/ProfileEdit";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessProfile from "./pages/BusinessProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/map" element={<Map />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/offer/:id" element={<OfferDetail />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/:id" element={<BookingForm />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
          <Route path="/business-profile" element={<BusinessProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
