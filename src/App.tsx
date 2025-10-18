import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nextProvider } from 'react-i18next';
import i18n from './locales';
import { ProtectedRoute } from "@/components/ProtectedRoute";
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


import { RouteTracker } from "./components/RouteTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <RouteTracker />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
           <Route path="/offer/:id" element={<OfferDetail />} />
           
           <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
           <Route path="/booking-form/:id" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
           <Route path="/auth" element={<Auth />} />
           <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
           
           <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
           <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/business-dashboard" element={<ProtectedRoute businessOnly><BusinessDashboard /></ProtectedRoute>} />
            <Route path="/business-profile" element={<ProtectedRoute businessOnly><BusinessProfile /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
