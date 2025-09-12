import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, insertMatchResultSchema } from "@shared/schema";

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

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json({ success: true, events });
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

  app.put("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
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

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
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
  app.get("/api/match-results", async (req, res) => {
    try {
      const matchResults = await storage.getMatchResults();
      res.json({ success: true, matchResults });
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

  app.post("/api/match-results", async (req, res) => {
    try {
      const matchResultData = insertMatchResultSchema.parse(req.body);
      
      // Generate unique match result ID
      const matchResultId = `match_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if match result already exists for this fixture
      const existingResult = await storage.getMatchResultByFixtureId(matchResultData.fixtureId);
      if (existingResult) {
        return res.status(400).json({ success: false, error: "Match result already exists for this fixture" });
      }
      
      const newMatchResult = await storage.createMatchResult({
        ...matchResultData,
        id: matchResultId
      });

      res.json({ success: true, matchResult: newMatchResult });
    } catch (error) {
      console.error("Create match result error:", error);
      res.status(500).json({ success: false, error: "Failed to create match result" });
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
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json({ success: true, posts });
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

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = req.body;
      
      // Generate unique post ID
      const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newPost = await storage.createPost({
        ...postData,
        id: postId,
        createdAt: new Date()
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
