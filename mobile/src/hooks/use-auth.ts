import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: sessionUser, isLoading: isSessionLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user-session"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: true,
  });

  const user = sessionUser;
  const isLoading = isSessionLoading;
  const isAuthenticated = !!user;
  const isCoach = user?.roles?.includes("coach") || false;
  const isParent = user?.roles?.includes("parent") || false;

  const updateUserRoles = async (userId: string, roles: ("coach" | "parent")[]) => {
    try {
      await apiRequest("POST", "/api/auth/update-roles-session", { roles });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update roles" };
    }
  };

  const associateWithClub = async (userId: string, clubCode: string) => {
    try {
      await apiRequest("POST", "/api/auth/associate-club-session", { clubCode });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "No club found with that code" };
    }
  };

  const logout = async () => {
    queryClient.clear();
    try {
      await fetch('/api/auth/logout-traditional', { method: 'POST', credentials: 'include' });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isCoach,
    isParent,
    updateUserRoles,
    associateWithClub,
    logout,
  };
}
