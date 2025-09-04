import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Email already in use" });
      }

      // Create new user with generated ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.createUser({
        id: userId,
        email,
        password,
        roles: [],
        teamIds: []
      });

      res.json({ success: true, userId: newUser.id });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = registerUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  app.post("/api/auth/update-roles", async (req, res) => {
    try {
      const { userId, roles } = req.body;
      
      if (!userId || !Array.isArray(roles)) {
        return res.status(400).json({ success: false, error: "Invalid request data" });
      }

      const updatedUser = await storage.updateUser(userId, { roles });
      
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Update roles error:", error);
      res.status(500).json({ success: false, error: "Failed to update roles" });
    }
  });

  app.post("/api/auth/associate-club", async (req, res) => {
    try {
      const { userId, clubCode } = req.body;
      
      if (!userId || !clubCode) {
        return res.status(400).json({ success: false, error: "Invalid request data" });
      }

      if (!clubCode.startsWith("1")) {
        return res.status(404).json({ success: false, error: "No club found with that code" });
      }

      const club = await storage.getClubByCode(clubCode);
      if (!club) {
        return res.status(404).json({ success: false, error: "No club found with that code" });
      }

      const updatedUser = await storage.updateUser(userId, { clubId: club.id });
      
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      res.json({ success: true, user: updatedUser, clubName: club.name });
    } catch (error) {
      console.error("Associate club error:", error);
      res.status(500).json({ success: false, error: "Failed to associate with club" });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, error: "Club ID required" });
      }

      const club = await storage.getClub(id);
      
      if (!club) {
        return res.status(404).json({ success: false, error: "Club not found" });
      }

      res.json({ success: true, club });
    } catch (error) {
      console.error("Get club error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch club" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const { name, ageGroup, clubId, managerId } = req.body;
      
      if (!name || !ageGroup || !clubId || !managerId) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Generate unique team ID and code
      const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const teamCode = `1${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      
      const newTeam = await storage.createTeam({
        id: teamId,
        name,
        ageGroup,
        code: teamCode,
        clubId,
        managerId,
        playerIds: [],
        wins: 0,
        draws: 0,
        losses: 0
      });

      res.json({ success: true, team: newTeam, teamCode });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ success: false, error: "Failed to create team" });
    }
  });

  app.get("/api/teams/manager/:managerId", async (req, res) => {
    try {
      const { managerId } = req.params;
      
      if (!managerId) {
        return res.status(400).json({ success: false, error: "Manager ID required" });
      }

      const teams = await storage.getTeamsByManagerId(managerId);
      res.json({ success: true, teams });
    } catch (error) {
      console.error("Get teams by manager error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch teams" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
