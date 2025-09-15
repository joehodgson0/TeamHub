// Replit Auth hook - referenced from javascript_log_in_with_replit blueprint
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const updateUserRoles = async (userId: string, roles: ("coach" | "parent")[]) => {
    try {
      await apiRequest("/api/auth/update-roles", {
        method: "POST",
        data: { roles },
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to update roles" };
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    updateUserRoles,
    // Helper method to check if user has a specific role
    hasRole: (role: "coach" | "parent") => user?.roles?.includes(role) || false,
  };
}
