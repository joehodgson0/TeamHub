import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertMatchResultSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth - referenced from javascript_log_in_with_replit blueprint
  await setupAuth(app);

  // Traditional username/password auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user
      const userData = {
        id: userId,
        email,
        password: hashedPassword,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        profileImageUrl: undefined
      };
      
      const user = await storage.upsertUser(userData);
      
      // Create session by setting req.user for traditional auth
      req.session.userId = user.id;
      
      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, error: 'Failed to register user' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      
      // Create session
      req.session.userId = user.id;
      
      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Failed to login' });
    }
  });
  
  app.post('/api/auth/logout-traditional', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });
  
  // Alternative user route for traditional auth (checks session)
  app.get('/api/auth/user-session', async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Get user session error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  });

  // Replit Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Authentication is now handled by Replit Auth (/api/login, /api/logout, /api/callback)

  // Session-based role update for username/password users
  app.post("/api/auth/update-roles-session", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const { roles } = req.body;
      
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

  // Original Google auth route (keep for when Google auth is re-enabled)
  app.post("/api/auth/update-roles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub; // Get from authenticated user instead of body
      const { roles } = req.body;
      
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

  // Session-based club association for username/password users
  app.post("/api/auth/associate-club-session", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const { clubCode } = req.body;
      
      if (!userId || !clubCode) {
        return res.status(400).json({ success: false, error: "Invalid request data" });
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

  // Original Google auth route (keep for when Google auth is re-enabled)
  app.post("/api/auth/associate-club", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub; // Get from authenticated user instead of body
      const { clubCode } = req.body;
      
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

  app.post("/api/teams", async (req: any, res) => {
    try {
      const { name, ageGroup } = req.body;
      
      if (!name || !ageGroup) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Get authenticated user ID from session (secure)
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Get user and verify they have coach role and club membership
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      if (!user.roles?.includes("coach")) {
        return res.status(403).json({ success: false, error: "Only coaches can create teams" });
      }

      if (!user.clubId) {
        return res.status(403).json({ success: false, error: "You must be associated with a club to create teams" });
      }

      // Generate unique team ID and code
      const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const teamCode = `1${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      
      const newTeam = await storage.createTeam({
        id: teamId,
        name,
        ageGroup,
        code: teamCode,
        clubId: user.clubId, // Use authenticated user's clubId (secure)
        playerIds: [],
        wins: 0,
        draws: 0,
        losses: 0
      });

      // Associate the creating coach with the team
      const updatedTeamIds = [...(user.teamIds || []), teamId];
      await storage.updateUser(userId, { teamIds: updatedTeamIds });

      res.json({ success: true, team: newTeam, teamCode });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ success: false, error: "Failed to create team" });
    }
  });

  app.get("/api/teams/club/:clubId", async (req: any, res) => {
    try {
      const { clubId } = req.params;
      
      if (!clubId) {
        return res.status(400).json({ success: false, error: "Club ID required" });
      }

      // Get current user from session
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.clubId !== clubId) {
        return res.status(403).json({ success: false, error: "Access denied to this club" });
      }

      let teams = [];

      // Role-based team filtering
      if (user.roles?.includes("coach")) {
        // Coaches: only see teams they manage (in their teamIds)
        if (user.teamIds?.length > 0) {
          for (const teamId of user.teamIds) {
            const team = await storage.getTeamById(teamId);
            if (team && team.clubId === clubId) {
              teams.push(team);
            }
          }
        }
      }

      if (user.roles?.includes("parent")) {
        // Parents: see teams their dependents play on
        const players = await storage.getPlayersByParentId(userId);
        const teamIds = Array.from(new Set(players.map(player => player.teamId).filter(Boolean)));
        
        for (const teamId of teamIds) {
          const team = await storage.getTeamById(teamId);
          if (team && team.clubId === clubId && !teams.find(t => t.id === team.id)) {
            teams.push(team);
          }
        }
      }

      res.json({ success: true, teams });
    } catch (error) {
      console.error("Get teams by club error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch teams" });
    }
  });

  app.put("/api/teams/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { name, ageGroup } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ success: false, error: "Team ID required" });
      }

      if (!name || !ageGroup) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const updatedTeam = await storage.updateTeam(teamId, { name, ageGroup });
      
      if (!updatedTeam) {
        return res.status(404).json({ success: false, error: "Team not found" });
      }

      res.json({ success: true, team: updatedTeam });
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ success: false, error: "Failed to update team" });
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

  app.post("/api/teams/join", async (req, res) => {
    try {
      const { teamCode, playerName, dateOfBirth, parentId } = req.body;
      
      if (!teamCode || !playerName || !dateOfBirth || !parentId) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Find the team by code
      const team = await storage.getTeamByCode(teamCode);
      if (!team) {
        return res.status(404).json({ success: false, error: "No team found with that code" });
      }

      // Get the parent user to check club association
      const parent = await storage.getUser(parentId);
      if (!parent) {
        return res.status(404).json({ success: false, error: "Parent not found" });
      }

      // Check club association rules
      if (parent.clubId) {
        // Parent already has a club - validate new team is from same club
        if (parent.clubId !== team.clubId) {
          return res.status(400).json({ 
            success: false, 
            error: "All dependents must join teams from the same club" 
          });
        }
      } else {
        // First team join - assign parent to team's club
        await storage.updateUser(parentId, { clubId: team.clubId });
      }

      // Generate unique player ID
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the player
      const newPlayer = await storage.createPlayer({
        id: playerId,
        name: playerName,
        dateOfBirth: new Date(dateOfBirth),
        teamId: team.id,
        parentId: parentId,
        attendance: 0,
        totalEvents: 0
      });

      res.json({ 
        success: true, 
        player: newPlayer, 
        team: team,
        message: `Successfully joined ${team.name}!`
      });
    } catch (error) {
      console.error("Join team error:", error);
      res.status(500).json({ success: false, error: "Failed to join team" });
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

      // Get the parent user to check club association
      const parent = await storage.getUser(parentId);
      if (!parent) {
        return res.status(404).json({ success: false, error: "Parent not found" });
      }

      // Check club association rules
      if (parent.clubId) {
        // Parent already has a club - validate new team is from same club
        if (parent.clubId !== team.clubId) {
          return res.status(400).json({ 
            success: false, 
            error: "All dependents must join teams from the same club" 
          });
        }
      } else {
        // First team join - assign parent to team's club
        await storage.updateUser(parentId, { clubId: team.clubId });
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

  app.get("/api/players/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      
      if (!teamId) {
        return res.status(400).json({ success: false, error: "Team ID required" });
      }

      const players = await storage.getPlayersByTeamId(teamId);
      res.json({ success: true, players });
    } catch (error) {
      console.error("Get players by team error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch players" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json({ success: true, events });
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch events" });
    }
  });

  // Session-based upcoming events for username/password users
  app.get("/api/events/upcoming-session", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      console.log(`[events/upcoming-session] User: ${user?.email}, roles: ${user?.roles}, teamIds: ${JSON.stringify(user?.teamIds)}`);
      
      if (!user) {
        return res.json({ success: true, events: [] });
      }
      
      let allEvents: any[] = [];
      
      // For coaches: get events only from teams they manage (user.teamIds)
      if (user.roles.includes("coach") && user.teamIds.length > 0) {
        console.log(`[events/upcoming-session] Coach branch: fetching events for teams ${JSON.stringify(user.teamIds)}`);
        for (const teamId of user.teamIds) {
          const teamEvents = await storage.getUpcomingEvents(teamId);
          console.log(`[events/upcoming-session] Team ${teamId}: found ${teamEvents.length} events`);
          allEvents.push(...teamEvents);
        }
      }
      
      // For parents: get events from teams where their dependents play
      if (user.roles.includes("parent")) {
        const players = await storage.getPlayersByParentId(user.id);
        const playerTeamIds = players.map((player: any) => player.teamId);
        console.log(`[events/upcoming-session] Parent branch: fetching events for teams ${JSON.stringify(playerTeamIds)}`);
        for (const teamId of playerTeamIds) {
          const teamEvents = await storage.getUpcomingEvents(teamId);
          console.log(`[events/upcoming-session] Team ${teamId}: found ${teamEvents.length} events`);
          allEvents.push(...teamEvents);
        }
      }
      
      // Remove duplicates and sort by date
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      console.log(`[events/upcoming-session] Returning ${uniqueEvents.length} events`);
      
      res.json({ success: true, events: uniqueEvents });
    } catch (error) {
      console.error("Get upcoming events error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch upcoming events" });
    }
  });

  // Session-based all events (including completed) for username/password users
  app.get("/api/events/all-session", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      console.log(`[events/all-session] User: ${user?.email}, roles: ${user?.roles}, teamIds: ${JSON.stringify(user?.teamIds)}`);
      
      if (!user) {
        return res.json({ success: true, events: [] });
      }
      
      let allEvents: any[] = [];
      
      // For coaches: get events only from teams they manage (user.teamIds)
      if (user.roles.includes("coach") && user.teamIds.length > 0) {
        console.log(`[events/all-session] Coach branch: fetching events for teams ${JSON.stringify(user.teamIds)}`);
        for (const teamId of user.teamIds) {
          const teamEvents = await storage.getEventsByTeamId(teamId);
          console.log(`[events/all-session] Team ${teamId}: found ${teamEvents.length} events`);
          allEvents.push(...teamEvents);
        }
      }
      
      // For parents: get events from teams where their dependents play
      if (user.roles.includes("parent")) {
        const players = await storage.getPlayersByParentId(user.id);
        const playerTeamIds = players.map((player: any) => player.teamId);
        console.log(`[events/all-session] Parent branch: fetching events for teams ${JSON.stringify(playerTeamIds)}`);
        for (const teamId of playerTeamIds) {
          const teamEvents = await storage.getEventsByTeamId(teamId);
          console.log(`[events/all-session] Team ${teamId}: found ${teamEvents.length} events`);
          allEvents.push(...teamEvents);
        }
      }
      
      // Remove duplicates and sort by date (most recent first)
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      uniqueEvents.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      console.log(`[events/all-session] Returning ${uniqueEvents.length} events`);
      
      res.json({ success: true, events: uniqueEvents });
    } catch (error) {
      console.error("Get all events error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch events" });
    }
  });

  // Original Google auth route (keep for when Google auth is re-enabled)
  app.get("/api/events/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.clubId && user.teamIds.length === 0)) {
        // User has no club or team associations - return empty
        return res.json({ success: true, events: [] });
      }
      
      // Get events for user's teams only
      let allEvents: any[] = [];
      for (const teamId of user.teamIds) {
        const teamEvents = await storage.getUpcomingEvents(teamId);
        allEvents.push(...teamEvents);
      }
      
      // Remove duplicates and sort by date
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      res.json({ success: true, events: uniqueEvents });
    } catch (error) {
      console.error("Get upcoming events error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/upcoming/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const events = await storage.getUpcomingEvents(teamId);
      res.json({ success: true, events });
    } catch (error) {
      console.error("Get upcoming events error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const events = await storage.getEventsByTeamId(teamId);
      res.json({ success: true, events });
    } catch (error) {
      console.error("Get events by team error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }

      res.json({ success: true, event });
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = req.body;
      
      // Generate unique event ID
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newEvent = await storage.createEvent({
        ...eventData,
        id: eventId,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        availability: eventData.availability || {},
        createdAt: new Date()
      });

      res.json({ success: true, event: newEvent });
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ success: false, error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Get authenticated user ID from session (secure)
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.roles?.includes("coach")) {
        return res.status(403).json({ success: false, error: "Only coaches can update events" });
      }
      
      // Get the event to check ownership
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
      
      // Check if coach owns this team
      if (!user.teamIds?.includes(existingEvent.teamId)) {
        return res.status(403).json({ success: false, error: "You can only update events for your own team" });
      }
      
      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);
      
      const updatedEvent = await storage.updateEvent(id, updates);
      
      if (!updatedEvent) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }

      res.json({ success: true, event: updatedEvent });
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ success: false, error: "Failed to update event" });
    }
  });

  app.put("/api/events/:eventId/availability", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { playerId, availability } = req.body;

      if (!playerId || !availability || !["available", "unavailable", "pending"].includes(availability)) {
        return res.status(400).json({ 
          success: false, 
          error: "Player ID and valid availability status required" 
        });
      }

      // Get the event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }

      // Update the availability
      const updatedAvailability = {
        ...event.availability,
        [playerId]: availability
      };

      await storage.updateEvent(eventId, { availability: updatedAvailability });

      res.json({ success: true, message: "Availability updated successfully" });
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ success: false, error: "Failed to update availability" });
    }
  });

  app.delete("/api/events/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get authenticated user ID from session (secure)
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.roles?.includes("coach")) {
        return res.status(403).json({ success: false, error: "Only coaches can delete events" });
      }
      
      // Get the event to check ownership before deleting
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
      
      // Check if coach owns this team
      if (!user.teamIds?.includes(existingEvent.teamId)) {
        return res.status(403).json({ success: false, error: "You can only delete events for your own team" });
      }
      
      const deleted = await storage.deleteEvent(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }

      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ success: false, error: "Failed to delete event" });
    }
  });

  // Match results routes
  // Session-based match results for username/password users
  app.get("/api/match-results-session", async (req: any, res) => {
    try {
      // Disable caching and ETags to ensure fresh data with enriched fields
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.removeHeader('ETag');
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.clubId && user.teamIds.length === 0)) {
        // User has no club or team associations - return empty
        return res.json({ success: true, matchResults: [] });
      }
      
      // Get match results based on user role and associations
      let allResults: any[] = [];
      
      if (user.roles.includes("coach") && user.clubId) {
        // For coaches with club association, get results for all club teams
        const clubTeams = await storage.getTeamsByClubId(user.clubId);
        for (const team of clubTeams) {
          const teamResults = await storage.getMatchResultsByTeamId(team.id);
          allResults.push(...teamResults);
        }
      } else if (user.roles.includes("parent")) {
        // For parents, get results for teams where their players are members
        const players = await storage.getPlayersByParentId(user.id);
        const playerTeamIds = players.map(player => player.teamId);
        for (const teamId of playerTeamIds) {
          const teamResults = await storage.getMatchResultsByTeamId(teamId);
          allResults.push(...teamResults);
        }
      } else {
        // Get results for user's specific teams only
        for (const teamId of user.teamIds) {
          const teamResults = await storage.getMatchResultsByTeamId(teamId);
          allResults.push(...teamResults);
        }
      }
      
      // Remove duplicates
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );
      
      // Enrich results with fixture data (opponent, startTime) and score
      const enrichedResults = await Promise.all(
        uniqueResults.map(async (result) => {
          const fixture = await storage.getEvent(result.fixtureId);
          
          // Calculate score from team's perspective
          let score = '';
          if (result.isHomeFixture) {
            score = `${result.homeTeamGoals}-${result.awayTeamGoals}`;
          } else {
            score = `${result.awayTeamGoals}-${result.homeTeamGoals}`;
          }
          
          return {
            ...result,
            opponent: fixture?.opponent || 'Unknown Opponent',
            startTime: fixture?.startTime ?? result.startTime,
            score
          };
        })
      );
      
      res.json({ 
        success: true, 
        matchResults: enrichedResults,
        _timestamp: Date.now() // Force fresh response
      });
    } catch (error) {
      console.error("Get match results error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch match results" });
    }
  });

  // Original Google auth route (keep for when Google auth is re-enabled)
  app.get("/api/match-results", isAuthenticated, async (req: any, res) => {
    try {
      // Disable caching to ensure fresh data with enriched fields
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.clubId && user.teamIds.length === 0)) {
        // User has no club or team associations - return empty
        return res.json({ success: true, matchResults: [] });
      }
      
      // Get match results for user's teams only
      let allResults: any[] = [];
      for (const teamId of user.teamIds) {
        const teamResults = await storage.getMatchResultsByTeamId(teamId);
        allResults.push(...teamResults);
      }
      
      // Remove duplicates
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );
      
      // Enrich results with fixture data (opponent, startTime) and score
      const enrichedResults = await Promise.all(
        uniqueResults.map(async (result) => {
          const fixture = await storage.getEvent(result.fixtureId);
          
          // Calculate score from team's perspective
          let score = '';
          if (result.isHomeFixture) {
            score = `${result.homeTeamGoals}-${result.awayTeamGoals}`;
          } else {
            score = `${result.awayTeamGoals}-${result.homeTeamGoals}`;
          }
          
          return {
            ...result,
            opponent: fixture?.opponent || 'Unknown Opponent',
            startTime: fixture?.startTime ?? result.startTime,
            score
          };
        })
      );
      
      res.json({ 
        success: true, 
        matchResults: enrichedResults,
        _timestamp: Date.now() // Force fresh response
      });
    } catch (error) {
      console.error("Get match results error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch match results" });
    }
  });

  app.get("/api/match-results/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const matchResults = await storage.getMatchResultsByTeamId(teamId);
      res.json({ success: true, matchResults });
    } catch (error) {
      console.error("Get match results by team error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch match results" });
    }
  });

  app.get("/api/match-results/fixture/:fixtureId", async (req, res) => {
    try {
      const { fixtureId } = req.params;
      const matchResult = await storage.getMatchResultByFixtureId(fixtureId);
      
      if (!matchResult) {
        return res.status(404).json({ success: false, error: "Match result not found" });
      }
      
      res.json({ success: true, matchResult });
    } catch (error) {
      console.error("Get match result by fixture error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch match result" });
    }
  });

  app.post("/api/match-results", async (req: any, res) => {
    try {
      // Get authenticated user ID from session (secure)
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.roles?.includes("coach")) {
        return res.status(403).json({ success: false, error: "Only coaches can update match results" });
      }
      
      // Define request schema for validation
      const matchResultRequestSchema = z.object({
        fixtureId: z.string().min(1, "Fixture ID is required"),
        teamId: z.string().min(1, "Team ID is required"),
        homeTeamGoals: z.number().min(0, "Home team goals must be 0 or more").max(50, "Home team goals must be 50 or less"),
        awayTeamGoals: z.number().min(0, "Away team goals must be 0 or more").max(50, "Away team goals must be 50 or less"),
        playerStats: z.record(z.object({
          goals: z.number().min(0, "Goals must be 0 or more").max(50, "Goals must be 50 or less"),
          assists: z.number().min(0, "Assists must be 0 or more").max(50, "Assists must be 50 or less")
        }))
      });

      const { fixtureId, teamId, homeTeamGoals, awayTeamGoals, playerStats } = matchResultRequestSchema.parse(req.body);

      // Get the fixture to determine isHomeFixture and compute result
      const fixture = await storage.getEvent(fixtureId);
      if (!fixture) {
        return res.status(404).json({ success: false, error: "Fixture not found" });
      }
      
      // Check if coach owns this team
      if (!user.teamIds?.includes(fixture.teamId)) {
        return res.status(403).json({ success: false, error: "You can only update match results for your own team" });
      }
      
      // Verify teamId matches fixture teamId
      if (teamId !== fixture.teamId) {
        return res.status(400).json({ success: false, error: "Team ID must match the fixture's team" });
      }

      const isHomeFixture = fixture.homeAway === "home";
      
      // Compute result based on home/away status
      let result: string;
      if (isHomeFixture) {
        if (homeTeamGoals > awayTeamGoals) result = "win";
        else if (homeTeamGoals < awayTeamGoals) result = "lose";
        else result = "draw";
      } else {
        if (awayTeamGoals > homeTeamGoals) result = "win";
        else if (awayTeamGoals < homeTeamGoals) result = "lose";
        else result = "draw";
      }

      // Filter playerStats to only include players with goals > 0 or assists > 0
      const filteredPlayerStats: Record<string, { goals: number; assists: number }> = {};
      for (const [playerId, stats] of Object.entries(playerStats as Record<string, { goals: number; assists: number }>)) {
        if (stats.goals > 0 || stats.assists > 0) {
          filteredPlayerStats[playerId] = { goals: stats.goals, assists: stats.assists };
        }
      }

      // Validate that sum of player goals doesn't exceed team goals
      const teamGoals = isHomeFixture ? homeTeamGoals : awayTeamGoals;
      const totalPlayerGoals = Object.values(filteredPlayerStats).reduce((sum, stats) => sum + stats.goals, 0);
      
      if (totalPlayerGoals > teamGoals) {
        return res.status(400).json({ 
          success: false, 
          error: "Player goals exceed team total goals" 
        });
      }

      // Upsert the match result
      const matchResult = await storage.upsertMatchResult(fixtureId, teamId, {
        homeTeamGoals,
        awayTeamGoals,
        isHomeFixture,
        result,
        playerStats: filteredPlayerStats
      });

      // Update team statistics from all match results for this team
      await storage.updateTeamStatsFromResults(teamId);

      res.json({ success: true, matchResult });
    } catch (error) {
      console.error("Create/update match result error:", error);
      res.status(500).json({ success: false, error: "Failed to save match result" });
    }
  });

  app.put("/api/match-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedMatchResult = await storage.updateMatchResult(id, updates);
      
      if (!updatedMatchResult) {
        return res.status(404).json({ success: false, error: "Match result not found" });
      }

      res.json({ success: true, matchResult: updatedMatchResult });
    } catch (error) {
      console.error("Update match result error:", error);
      res.status(500).json({ success: false, error: "Failed to update match result" });
    }
  });

  app.delete("/api/match-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteMatchResult(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Match result not found" });
      }

      res.json({ success: true, message: "Match result deleted successfully" });
    } catch (error) {
      console.error("Delete match result error:", error);
      res.status(500).json({ success: false, error: "Failed to delete match result" });
    }
  });


  // Post routes
  // Session-based posts for username/password users
  app.get("/api/posts-session", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.clubId && user.teamIds.length === 0)) {
        // User has no club or team associations - return empty
        return res.json({ success: true, posts: [] });
      }
      
      let allPosts: any[] = [];
      
      // Get club-wide posts (posts without specific team) if user has club association
      if (user.clubId) {
        const clubPosts = await storage.getPostsByClubId(user.clubId);
        // Only include club-wide posts (no specific teamId)
        const clubWidePosts = clubPosts.filter(post => !post.teamId);
        allPosts.push(...clubWidePosts);
      }
      
      // Role-based team post filtering
      let relevantTeamIds = [];

      if (user.roles.includes("coach")) {
        // Coaches: only see posts from teams they manage (in their teamIds)
        relevantTeamIds.push(...(user.teamIds || []));
      }

      if (user.roles.includes("parent")) {
        // Parents: see posts from teams their dependents play on
        const players = await storage.getPlayersByParentId(userId);
        const parentTeamIds = players.map(player => player.teamId).filter(Boolean);
        relevantTeamIds.push(...parentTeamIds);
      }

      // Remove duplicates
      relevantTeamIds = Array.from(new Set(relevantTeamIds));

      // Get posts from relevant teams only
      for (const teamId of relevantTeamIds) {
        const teamPosts = await storage.getPostsByTeamId(teamId);
        allPosts.push(...teamPosts);
      }
      
      // Remove duplicates and sort by creation date
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );
      
      console.log(`[posts-session] User ${user.email} (roles: ${user.roles}, teams: ${user.teamIds?.length || 0}) - returning ${uniquePosts.length} posts`);
      console.log(`[posts-session] Post details:`, uniquePosts.map(p => ({ id: p.id, title: p.title, teamId: p.teamId, clubId: p.clubId })));
      
      res.json({ success: true, posts: uniquePosts });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch posts" });
    }
  });

  // Original Google auth route (keep for when Google auth is re-enabled)
  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.clubId && user.teamIds.length === 0)) {
        // User has no club or team associations - return empty
        return res.json({ success: true, posts: [] });
      }
      
      let allPosts: any[] = [];
      
      // Get club-wide posts (posts without specific team) if user has club association
      if (user.clubId) {
        const clubPosts = await storage.getPostsByClubId(user.clubId);
        // Only include club-wide posts (no specific teamId)
        const clubWidePosts = clubPosts.filter(post => !post.teamId);
        allPosts.push(...clubWidePosts);
      }
      
      // Get team posts for user's teams
      for (const teamId of user.teamIds) {
        const teamPosts = await storage.getPostsByTeamId(teamId);
        allPosts.push(...teamPosts);
      }
      
      // Remove duplicates and sort by creation date
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );
      
      res.json({ success: true, posts: uniquePosts });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const posts = await storage.getPostsByTeamId(teamId);
      res.json({ success: true, posts });
    } catch (error) {
      console.error("Get posts by team error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/club/:clubId", async (req, res) => {
    try {
      const { clubId } = req.params;
      const posts = await storage.getPostsByClubId(clubId);
      res.json({ success: true, posts });
    } catch (error) {
      console.error("Get posts by club error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req: any, res) => {
    try {
      const { type, title, content, scope, teamId: requestedTeamId } = req.body;
      
      if (!type || !title || !content || !scope) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Get authenticated user ID from session (secure)
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Get user and verify permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      if (!user.clubId) {
        return res.status(403).json({ success: false, error: "You must be associated with a club to create posts" });
      }

      // Generate unique post ID
      const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine post assignment based on scope and user permissions
      let teamId = undefined;
      let clubId = undefined;

      if (scope === "team") {
        // For team posts, user must be a coach and have teams
        if (!user.roles?.includes("coach")) {
          return res.status(403).json({ success: false, error: "Only coaches can create team posts" });
        }
        
        if (!user.teamIds || user.teamIds.length === 0) {
          return res.status(403).json({ success: false, error: "You must manage a team to create team posts" });
        }
        
        // Validate that teamId is provided
        if (!requestedTeamId) {
          return res.status(400).json({ success: false, error: "Team ID is required for team posts" });
        }
        
        // Validate that user manages the requested team
        if (!user.teamIds.includes(requestedTeamId)) {
          return res.status(403).json({ success: false, error: "You do not have permission to post to this team" });
        }
        
        // Use the provided teamId
        teamId = requestedTeamId;
      } else if (scope === "club") {
        // For club posts, assign to user's club
        clubId = user.clubId;
      } else {
        return res.status(400).json({ success: false, error: "Invalid post scope" });
      }

      const newPost = await storage.createPost({
        id: postId,
        type,
        title,
        content,
        authorId: userId,
        authorName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || 'Unknown',
        authorRole: user.roles?.includes("coach") ? "Team Manager" : "Club Administrator",
        teamId,
        clubId
      });

      res.json({ success: true, post: newPost });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ success: false, error: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedPost = await storage.updatePost(id, updateData);
      
      if (!updatedPost) {
        return res.status(404).json({ success: false, error: "Post not found" });
      }

      res.json({ success: true, post: updatedPost });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ success: false, error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deletePost(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Post not found" });
      }

      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ success: false, error: "Failed to delete post" });
    }
  });

  // Award routes
  app.get("/api/awards", async (req, res) => {
    try {
      const awards = await storage.getAwards();
      res.json({ success: true, awards });
    } catch (error) {
      console.error("Get awards error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch awards" });
    }
  });

  app.get("/api/awards/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const awards = await storage.getAwardsByTeamId(teamId);
      res.json({ success: true, awards });
    } catch (error) {
      console.error("Get awards by team error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch awards" });
    }
  });

  app.post("/api/awards", async (req, res) => {
    try {
      const awardData = req.body;
      
      // Generate unique award ID
      const awardId = `award_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newAward = await storage.createAward({
        ...awardData,
        id: awardId,
        createdAt: new Date()
      });

      res.json({ success: true, award: newAward });
    } catch (error) {
      console.error("Create award error:", error);
      res.status(500).json({ success: false, error: "Failed to create award" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
