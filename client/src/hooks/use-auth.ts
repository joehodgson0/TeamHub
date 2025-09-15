// Dual authentication hook - supports both Replit Auth and traditional auth
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  // Disable Google auth query to prevent infinite loop - hooks must be called consistently
  const { data: googleUser, isLoading: isGoogleLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: false, // Disabled to prevent infinite loop
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

  // Use session auth for email/password login
  const { data: sessionUser, isLoading: isSessionLoading } = useQuery<User>({
    queryKey: ["/api/auth/user-session"],
    retry: false, 
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

  // Prefer Google user if both exist, otherwise use session user
  const user = googleUser || sessionUser;
  const isLoading = isGoogleLoading || isSessionLoading;

  const updateUserRoles = async (userId: string, roles: ("coach" | "parent")[]) => {
    try {
      // Use session-based route for username/password users
      await apiRequest("POST", "/api/auth/update-roles-session", { roles });
      
      // Invalidate and refetch user data for session users
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to update roles" };
    }
  };

  const logout = async () => {
    // Clear local cache
    queryClient.clear();
    
    try {
      // Try traditional logout first if we have a session user
      if (sessionUser && !googleUser) {
        await fetch('/api/auth/logout-traditional', { method: 'POST', credentials: 'include' });
        window.location.href = "/";
      } else {
        // Use Replit Auth logout for Google users
        window.location.href = "/api/logout";
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to home page
      window.location.href = "/";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    updateUserRoles,
    logout,
    // Helper method to check if user has a specific role
    hasRole: (role: "coach" | "parent") => user?.roles?.includes(role) || false,
  };
}
