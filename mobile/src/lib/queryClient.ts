import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from './config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh, no background refetches during normal use
      gcTime: 1000 * 60 * 15, // 15 minutes - keep data in memory across all tab switches
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false, // Never refetch on mount if data exists — use pull-to-refresh instead
      networkMode: 'always', // Never pause queries due to React Native network detection
      retry: 0, // Fail fast — don't retry, keeps the UI responsive on error
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
