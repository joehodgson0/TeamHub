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
      const { name, ageGroup, clubId } = req.body;
      
      if (!name || !ageGroup || !clubId) {
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

  app.get("/api/teams/club/:clubId", async (req, res) => {
    try {
      const { clubId } = req.params;
      
      if (!clubId) {
        return res.status(400).json({ success: false, error: "Club ID required" });
      }

      const teams = await storage.getTeamsByClubId(clubId);
      res.json({ success: true, teams });
    } catch (error) {
      console.error("Get teams by club error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: "User ID required" });
      }

      // Get teams through user's dependents (players)
      const players = await storage.getPlayersByParentId(userId);
      const teamIds = Array.from(new Set(players.map(player => player.teamId)));
      const teams = [];
      
      for (const teamId of teamIds) {
        const team = await storage.getTeamById(teamId);
        if (team) teams.push(team);
      }

      res.json({ success: true, teams });
    } catch (error) {
      console.error("Get teams by user error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ success: false, error: "Team code required" });
      }

      const team = await storage.getTeamByCode(code);
      
      if (!team) {
        return res.status(404).json({ success: false, error: "No team found with that code" });
      }

      res.json({ success: true, team });
    } catch (error) {
      console.error("Get team by code error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch team" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const { name, dateOfBirth, teamCode, parentId } = req.body;
      
      if (!name || !dateOfBirth || !teamCode || !parentId) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Find team by code
      const team = await storage.getTeamByCode(teamCode);
      if (!team) {
        return res.status(404).json({ success: false, error: "No team found with code " + teamCode });
      }

      // Generate unique player ID
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newPlayer = await storage.createPlayer({
        id: playerId,
        name,
        dateOfBirth: new Date(dateOfBirth),
        teamId: team.id,
        parentId,
        attendance: 0,
        totalEvents: 0
      });

      // Update team's player list
      const updatedPlayerIds = [...team.playerIds, playerId];
      await storage.updateTeam(team.id, {
        playerIds: updatedPlayerIds
      });

      res.json({ success: true, player: newPlayer, team: team.name });
    } catch (error) {
      console.error("Create player error:", error);
      res.status(500).json({ success: false, error: "Failed to create player" });
    }
  });

  app.get("/api/players/parent/:parentId", async (req, res) => {
    try {
      const { parentId } = req.params;
      
      if (!parentId) {
        return res.status(400).json({ success: false, error: "Parent ID required" });
      }

      const players = await storage.getPlayersByParentId(parentId);
      res.json({ success: true, players });
    } catch (error) {
      console.error("Get players by parent error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch players" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
