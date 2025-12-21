import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from './config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - prevent refetch on tab switch
      gcTime: 1000 * 60 * 10, // 10 minutes - keep data in memory longer
      refetchOnWindowFocus: false, // CRITICAL: Don't refetch when tab gains focus
      refetchOnReconnect: false, // Don't refetch on network reconnect
      refetchOnMount: false, // Don't refetch on component mount if data exists
      retry: 1,
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
