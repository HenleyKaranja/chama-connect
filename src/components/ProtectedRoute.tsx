import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChamaMembership } from "@/hooks/use-chama-membership";
import type { Database } from "@/integrations/supabase/types";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  requiresChama?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requiresChama }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const { hasChama, isLoading: chamaLoading } = useChamaMembership();

  if (loading || chamaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (requiresChama && !hasChama && role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold">Join a Chama First</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            You need to be a member of at least one chama to access this feature. Browse available chamas and join one to get started.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/chamas">Browse Chamas</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
