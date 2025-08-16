import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SecurityMonitor } from "./SecurityMonitor";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  businessOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  businessOnly = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      navigate("/auth");
      return;
    }

    if (businessOnly && user?.user_metadata?.account_type !== "business") {
      navigate("/auth");
      return;
    }

    // Additional session validation for authenticated users
    if (user) {
      validateSession();
    }
  }, [user, loading, navigate, requireAuth, businessOnly]);

  const validateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setSessionValid(false);
        navigate("/auth");
        return;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        setSessionValid(false);
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setSessionValid(true);
    } catch (error) {
      console.error('Session validation error:', error);
      setSessionValid(false);
      navigate("/auth");
    }
  };

  if (loading || !sessionValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (businessOnly && user?.user_metadata?.account_type !== "business") {
    return null;
  }

  return (
    <>
      <SecurityMonitor />
      {children}
    </>
  );
}