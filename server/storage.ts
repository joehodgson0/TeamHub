import { users, clubs, teams, players, events, posts, awards, matchResults, type User, type UpsertUser, type Club, type Team, type Player, type Event, type Post, type Award, type MatchResult, type InsertClub, type InsertTeam, type InsertPlayer, type InsertEvent, type InsertPost, type InsertAward, type InsertMatchResult } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth - MANDATORY
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Legacy user methods (keep for backward compatibility during migration)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Club methods
  getClub(id: string): Promise<Club | undefined>;
  getClubByCode(code: string): Promise<Club | undefined>;
  getClubs(): Promise<Club[]>;
  createClub(insertClub: InsertClub): Promise<Club>;

  // Team methods
  getTeam(id: string): Promise<Team | undefined>;
  getTeamById(id: string): Promise<Team | undefined>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  getTeamsByClubId(clubId: string): Promise<Team[]>;
  createTeam(insertTeam: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;

  // Player methods
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayers(): Promise<Player[]>;
  getPlayersByTeamId(teamId: string): Promise<Player[]>;
  getPlayersByParentId(parentId: string): Promise<Player[]>;
  createPlayer(insertPlayer: InsertPlayer): Promise<Player>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByTeamId(teamId: string): Promise<Event[]>;
  getUpcomingEvents(teamId?: string): Promise<Event[]>;
  createEvent(insertEvent: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined>;
  
  // Legacy fixture methods for backward compatibility
  getFixture(id: string): Promise<Event | undefined>;
  getFixtures(): Promise<Event[]>;
  getFixturesByTeamId(teamId: string): Promise<Event[]>;
  getUpcomingFixtures(teamId?: string): Promise<Event[]>;
  createFixture(insertEvent: InsertEvent): Promise<Event>;
  updateFixture(id: string, updates: Partial<Event>): Promise<Event | undefined>;

  // Post methods
  getPost(id: string): Promise<Post | undefined>;
  getPosts(): Promise<Post[]>;
  getPostsByTeamId(teamId: string): Promise<Post[]>;
  getPostsByClubId(clubId: string): Promise<Post[]>;
  createPost(insertPost: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;

  // Award methods
  getAwards(): Promise<Award[]>;
  getAwardsByTeamId(teamId: string): Promise<Award[]>;
  createAward(insertAward: InsertAward): Promise<Award>;

  // Match result methods
  getMatchResult(id: string): Promise<MatchResult | undefined>;
  getMatchResults(): Promise<MatchResult[]>;
  getMatchResultsByTeamId(teamId: string): Promise<MatchResult[]>;
  getMatchResultByFixtureId(fixtureId: string): Promise<MatchResult | undefined>;
  createMatchResult(insertMatchResult: InsertMatchResult): Promise<MatchResult>;
  updateMatchResult(id: string, updates: Partial<MatchResult>): Promise<MatchResult | undefined>;
  upsertMatchResult(fixtureId: string, teamId: string, matchResultData: Omit<InsertMatchResult, 'id' | 'fixtureId' | 'teamId'>): Promise<MatchResult>;
  updateTeamStatsFromResults(teamId: string): Promise<void>;
  deleteMatchResult(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  private normalizeUser(user: any): User {
    return {
      ...user,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    };
  }

  private normalizeClub(club: any): Club {
    return {
      ...club,
      established: club.established || undefined
    };
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? {
      ...user,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ? {
      ...user,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    } : undefined;
  }

  async getUsers(): Promise<User[]> {
    const users_data = await db.select().from(users);
    return users_data.map(user => ({
      ...user,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    }));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return this.normalizeUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user ? {
      ...user,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    } : undefined;
  }

  // Club methods
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club ? {
      ...club,
      established: club.established || undefined
    } : undefined;
  }

  async getClubByCode(code: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.code, code));
    return club ? {
      ...club,
      established: club.established || undefined
    } : undefined;
  }

  async getClubs(): Promise<Club[]> {
    const clubs_data = await db.select().from(clubs);
    return clubs_data.map(club => ({
      ...club,
      established: club.established || undefined
    }));
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(insertClub)
      .returning();
    return this.normalizeClub(club);
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    return this.getTeam(id);
  }

  async getTeamByCode(code: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.code, code));
    return team || undefined;
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeamsByClubId(clubId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.clubId, clubId));
  }


  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  // Player methods
  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async getPlayersByTeamId(teamId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.teamId, teamId));
  }

  async getPlayersByParentId(parentId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.parentId, parentId));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player as Player;
  }

  // Event methods
  private normalizeEvent(event: any): Event {
    return {
      ...event,
      name: event.name || undefined,
      opponent: event.opponent || undefined,
      additionalInfo: event.additionalInfo || undefined,
      homeAway: event.homeAway || undefined,
      result: event.result || undefined
    };
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event ? this.normalizeEvent(event) : undefined;
  }

  async getEvents(): Promise<Event[]> {
    const events_data = await db.select().from(events);
    return events_data.map(event => this.normalizeEvent(event));
  }

  async getEventsByTeamId(teamId: string): Promise<Event[]> {
    const events_data = await db.select().from(events).where(eq(events.teamId, teamId));
    return events_data.map(event => this.normalizeEvent(event));
  }

  async getUpcomingEvents(teamId?: string): Promise<Event[]> {
    const now = new Date();
    let events_data;
    if (teamId) {
      events_data = await db
        .select()
        .from(events)
        .where(and(eq(events.teamId, teamId), gt(events.startTime, now)))
        .orderBy(events.startTime);
    } else {
      events_data = await db
        .select()
        .from(events)
        .where(gt(events.startTime, now))
        .orderBy(events.startTime);
    }
    return events_data.map(event => this.normalizeEvent(event));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return this.normalizeEvent(event);
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event ? this.normalizeEvent(event) : undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const deletedRows = await db
      .delete(events)
      .where(eq(events.id, id));
    return deletedRows.rowCount > 0;
  }

  // Legacy fixture methods for backward compatibility
  async getFixture(id: string): Promise<Event | undefined> {
    return this.getEvent(id);
  }

  async getFixtures(): Promise<Event[]> {
    return this.getEvents();
  }

  async getFixturesByTeamId(teamId: string): Promise<Event[]> {
    return this.getEventsByTeamId(teamId);
  }

  async getUpcomingFixtures(teamId?: string): Promise<Event[]> {
    return this.getUpcomingEvents(teamId);
  }

  async createFixture(insertEvent: InsertEvent): Promise<Event> {
    return this.createEvent(insertEvent);
  }

  async updateFixture(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    return this.updateEvent(id, updates);
  }

  async deleteFixture(id: string): Promise<boolean> {
    return this.deleteEvent(id);
  }

  // Post methods
  private normalizePost(post: any): Post {
    return {
      ...post,
      teamId: post.teamId || undefined,
      clubId: post.clubId || undefined
    };
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post ? this.normalizePost(post) : undefined;
  }

  async getPosts(): Promise<Post[]> {
    const posts_data = await db.select().from(posts);
    return posts_data.map(post => this.normalizePost(post));
  }

  async getPostsByTeamId(teamId: string): Promise<Post[]> {
    const posts_data = await db.select().from(posts).where(eq(posts.teamId, teamId));
    return posts_data.map(post => this.normalizePost(post));
  }

  async getPostsByClubId(clubId: string): Promise<Post[]> {
    const posts_data = await db.select().from(posts).where(eq(posts.clubId, clubId));
    return posts_data.map(post => this.normalizePost(post));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return this.normalizePost(post);
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return post ? this.normalizePost(post) : undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.count > 0;
  }

  // Award methods
  async getAwards(): Promise<Award[]> {
    return await db.select().from(awards);
  }

  async getAwardsByTeamId(teamId: string): Promise<Award[]> {
    return await db.select().from(awards).where(eq(awards.teamId, teamId));
  }

  async createAward(insertAward: InsertAward): Promise<Award> {
    const [award] = await db
      .insert(awards)
      .values(insertAward)
      .returning();
    return award;
  }

  // Match result methods
  async getMatchResult(id: string): Promise<MatchResult | undefined> {
    const [matchResult] = await db.select().from(matchResults).where(eq(matchResults.id, id));
    return matchResult || undefined;
  }

  async getMatchResults(): Promise<any[]> {
    return await db
      .select({
        ...matchResults,
        opponent: events.opponent,
        startTime: events.startTime,
        name: events.name
      })
      .from(matchResults)
      .leftJoin(events, eq(matchResults.fixtureId, events.id))
      .orderBy(events.startTime);
  }

  async getMatchResultsByTeamId(teamId: string): Promise<MatchResult[]> {
    return await db.select().from(matchResults).where(eq(matchResults.teamId, teamId));
  }

  async getMatchResultByFixtureId(fixtureId: string): Promise<MatchResult | undefined> {
    const [matchResult] = await db.select().from(matchResults).where(eq(matchResults.fixtureId, fixtureId));
    return matchResult || undefined;
  }

  async createMatchResult(insertMatchResult: InsertMatchResult): Promise<MatchResult> {
    const [matchResult] = await db
      .insert(matchResults)
      .values(insertMatchResult)
      .returning();
    return matchResult;
  }

  async updateMatchResult(id: string, updates: Partial<MatchResult>): Promise<MatchResult | undefined> {
    const [matchResult] = await db
      .update(matchResults)
      .set(updates)
      .where(eq(matchResults.id, id))
      .returning();
    return matchResult || undefined;
  }

  async upsertMatchResult(fixtureId: string, teamId: string, matchResultData: Omit<InsertMatchResult, 'id' | 'fixtureId' | 'teamId'>): Promise<MatchResult> {
    // Check if a match result already exists for this fixture and team
    const existingResult = await db.select().from(matchResults).where(
      and(eq(matchResults.fixtureId, fixtureId), eq(matchResults.teamId, teamId))
    );

    if (existingResult.length > 0) {
      // Update existing result
      const [updated] = await db
        .update(matchResults)
        .set(matchResultData)
        .where(and(eq(matchResults.fixtureId, fixtureId), eq(matchResults.teamId, teamId)))
        .returning();
      return updated;
    } else {
      // Create new result
      const matchResultId = `match_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const [created] = await db
        .insert(matchResults)
        .values({
          id: matchResultId,
          fixtureId,
          teamId,
          ...matchResultData
        })
        .returning();
      return created;
    }
  }

  async updateTeamStatsFromResults(teamId: string): Promise<void> {
    // Get all match results for this team
    const results = await db.select().from(matchResults).where(eq(matchResults.teamId, teamId));
    
    // Calculate stats from all results
    const stats = results.reduce((acc, result) => {
      switch (result.result) {
        case "win":
          acc.wins++;
          break;
        case "draw":
          acc.draws++;
          break;
        case "loss":
          acc.losses++;
          break;
      }
      return acc;
    }, { wins: 0, draws: 0, losses: 0 });

    // Update the team with the calculated stats
    await db
      .update(teams)
      .set({
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses
      })
      .where(eq(teams.id, teamId));
  }

  async deleteMatchResult(id: string): Promise<boolean> {
    const deletedRows = await db
      .delete(matchResults)
      .where(eq(matchResults.id, id));
    return deletedRows.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();