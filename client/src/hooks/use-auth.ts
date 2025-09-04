import { useState, useEffect } from "react";
import { authManager, AuthState } from "@/lib/auth";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = authManager.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authManager.login.bind(authManager),
    register: authManager.register.bind(authManager),
    updateUserRoles: authManager.updateUserRoles.bind(authManager),
    associateWithClub: authManager.associateWithClub.bind(authManager),
    logout: authManager.logout.bind(authManager),
    hasRole: authManager.hasRole.bind(authManager),
  };
}
