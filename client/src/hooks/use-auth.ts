// Replit Auth hook - referenced from javascript_log_in_with_replit blueprint
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    // Helper method to check if user has a specific role
    hasRole: (role: string) => user?.roles?.includes(role) || false,
  };
}
