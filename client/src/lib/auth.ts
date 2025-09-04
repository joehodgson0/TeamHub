import { storage } from "./storage";
import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthManager {
  private currentUser: User | null = null;
  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    const userId = storage.getCurrentUserId();
    if (userId) {
      this.currentUser = storage.getUserById(userId) || null;
    }
  }

  private notifyListeners() {
    const state: AuthState = {
      user: this.currentUser,
      isAuthenticated: !!this.currentUser,
      isLoading: false,
    };
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener({
      user: this.currentUser,
      isAuthenticated: !!this.currentUser,
      isLoading: false,
    });

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = storage.getUserByEmail(email);
      
      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (user.password !== password) {
        return { success: false, error: "Invalid password" };
      }

      this.currentUser = user;
      storage.setCurrentUser(user.id);
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  }

  async register(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const existingUser = storage.getUserByEmail(email);
      
      if (existingUser) {
        return { success: false, error: "Email already in use" };
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser: User = {
        id: userId,
        email,
        password,
        roles: [],
        teamIds: [],
        createdAt: new Date(),
      };

      storage.createUser(newUser);

      return { success: true, userId };
    } catch (error) {
      return { success: false, error: "Registration failed" };
    }
  }

  async updateUserRoles(userId: string, roles: Array<"coach" | "parent">): Promise<{ success: boolean; error?: string }> {
    try {
      const updatedUser = storage.updateUser(userId, { roles });
      
      if (!updatedUser) {
        return { success: false, error: "User not found" };
      }

      if (this.currentUser?.id === userId) {
        this.currentUser = updatedUser;
        storage.setCurrentUser(userId);
        this.notifyListeners();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to update roles" };
    }
  }

  async associateWithClub(userId: string, clubCode: string): Promise<{ success: boolean; error?: string; clubName?: string }> {
    try {
      if (!clubCode.startsWith("1")) {
        return { success: false, error: "No club found with that code" };
      }

      const club = storage.getClubByCode(clubCode);
      if (!club) {
        return { success: false, error: "No club found with that code" };
      }

      const updatedUser = storage.updateUser(userId, { clubId: club.id });
      
      if (!updatedUser) {
        return { success: false, error: "User not found" };
      }

      if (this.currentUser?.id === userId) {
        this.currentUser = updatedUser;
        this.notifyListeners();
      }

      return { success: true, clubName: club.name };
    } catch (error) {
      return { success: false, error: "Failed to associate with club" };
    }
  }

  logout() {
    this.currentUser = null;
    storage.logout();
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasRole(role: "coach" | "parent"): boolean {
    return this.currentUser?.roles.includes(role) || false;
  }
}

export const authManager = new AuthManager();
