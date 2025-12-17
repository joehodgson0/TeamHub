import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: ('coach' | 'parent')[];
  clubId?: string;
  teamIds?: string[];
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: 'coach' | 'parent') => boolean;
  isCoach: boolean;
  isParent: boolean;
  logout: () => Promise<void>;
  updateUserRoles: (userId: string, roles: ('coach' | 'parent')[]) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

// Store user data in memory for instant access across re-renders
let cachedUser: User | null = null;
let isFetching = false;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);

  const fetchUser = useCallback(async (forceRefresh = false) => {
    // Skip if already fetching or if we have cached data and not forcing refresh
    if (isFetching || (cachedUser && !forceRefresh)) {
      if (cachedUser) {
        setUser(cachedUser);
        setIsLoading(false);
      }
      return;
    }

    isFetching = true;
    
    // Set loading to true for forced refreshes (e.g., after login)
    // This ensures the root layout's useEffect re-triggers
    if (forceRefresh) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user-session`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        cachedUser = null;
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      // API returns user data directly (not wrapped in a 'user' property)
      const newUser = (data.id ? data : null) as User | null;
      
      cachedUser = newUser;
      setUser(newUser);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
      isFetching = false;
    }
  }, []);

  // Fetch user on mount only
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout-traditional`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all cached data to prevent stale data between user sessions
    cachedUser = null;
    setUser(null);
    queryClient.clear();
  }, []);

  const updateUserRoles = useCallback(async (userId: string, roles: ('coach' | 'parent')[]) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/update-roles-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, roles }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update roles');
    }
    
    // Update local cache immediately
    if (cachedUser) {
      cachedUser = { ...cachedUser, roles };
      setUser(cachedUser);
    }
    
    // Refresh from server in background
    setTimeout(() => fetchUser(true), 100);
  }, [fetchUser]);

  const refreshUser = useCallback(() => fetchUser(true), [fetchUser]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    hasRole: (role: 'coach' | 'parent') => user?.roles?.includes(role) ?? false,
    isCoach: user?.roles?.includes('coach') ?? false,
    isParent: user?.roles?.includes('parent') ?? false,
    logout,
    updateUserRoles,
    refreshUser,
  }), [user, isLoading, logout, updateUserRoles, refreshUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Clear cache on logout (called from outside React)
export function clearUserCache() {
  cachedUser = null;
}
