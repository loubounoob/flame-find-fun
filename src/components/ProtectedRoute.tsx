import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  }, [user, loading, navigate, requireAuth, businessOnly]);

  if (loading) {
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

  return <>{children}</>;
}