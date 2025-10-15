import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { API_BASE_URL } from '@/lib/config';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: ('coach' | 'parent')[];
  clubId?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/user-session`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.user as User | null;
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/logout-traditional', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/user-session'], null);
    },
  });

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    hasRole: (role: 'coach' | 'parent') => user?.roles?.includes(role) ?? false,
    logout: () => logoutMutation.mutateAsync(),
  };
}
