import { users, clubs, teams, players, events, posts, matchResults, fees, feeAssignments, payments, feeSchedules, feeEnrollments, type User, type UpsertUser, type Club, type Team, type Player, type Event, type Post, type MatchResult, type InsertClub, type InsertTeam, type InsertPlayer, type InsertEvent, type InsertPost, type InsertMatchResult, type Fee, type InsertFee, type FeeAssignment, type InsertFeeAssignment, type Payment, type InsertPayment, type FeeSchedule, type InsertFeeSchedule, type FeeEnrollment, type InsertFeeEnrollment } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, inArray, or, isNull, lt, lte } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth - MANDATORY
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Legacy user methods (keep for backward compatibility during migration)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

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
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayersByParentId(parentId: string): Promise<boolean>;

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

  // Fee methods
  getFee(id: string): Promise<Fee | undefined>;
  getFeesByClubId(clubId: string): Promise<Fee[]>;
  createFee(insertFee: InsertFee): Promise<Fee>;
  updateFee(id: string, updates: Partial<Fee>): Promise<Fee | undefined>;
  deleteFee(id: string): Promise<boolean>;

  // Fee assignment methods
  getFeeAssignment(id: string): Promise<FeeAssignment | undefined>;
  getFeeAssignmentsByFeeId(feeId: string): Promise<FeeAssignment[]>;
  getFeeAssignmentsByPlayerId(playerId: string): Promise<FeeAssignment[]>;
  getFeeAssignmentsByPlayerIds(playerIds: string[]): Promise<FeeAssignment[]>;
  createFeeAssignment(insertFeeAssignment: InsertFeeAssignment): Promise<FeeAssignment>;
  createFeeAssignments(insertFeeAssignments: InsertFeeAssignment[]): Promise<FeeAssignment[]>;
  updateFeeAssignment(id: string, updates: Partial<FeeAssignment>): Promise<FeeAssignment | undefined>;

  // Payment methods
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByFeeAssignmentId(feeAssignmentId: string): Promise<Payment[]>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentByProviderSessionId(providerSessionId: string): Promise<Payment | undefined>;
  createPayment(insertPayment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Fee schedule methods (per club, per season defaults)
  getFeeSchedule(clubId: string, season: string): Promise<FeeSchedule | undefined>;
  getFeeSchedulesByClubId(clubId: string): Promise<FeeSchedule[]>;
  upsertFeeSchedule(insertFeeSchedule: InsertFeeSchedule): Promise<FeeSchedule>;

  // Fee enrollment methods (a player's chosen plan for a season)
  getFeeEnrollment(id: string): Promise<FeeEnrollment | undefined>;
  getFeeEnrollmentByPlayerAndSeason(playerId: string, season: string): Promise<FeeEnrollment | undefined>;
  getFeeEnrollmentsByPlayerId(playerId: string): Promise<FeeEnrollment[]>;
  getFeeEnrollmentsByClubAndSeason(clubId: string, season: string): Promise<FeeEnrollment[]>;
  getFeeEnrollmentsByTeamId(teamId: string): Promise<FeeEnrollment[]>;
  createFeeEnrollment(insertFeeEnrollment: InsertFeeEnrollment): Promise<FeeEnrollment>;
  updateFeeEnrollment(id: string, updates: Partial<FeeEnrollment>): Promise<FeeEnrollment | undefined>;

  // Reminder service support
  getFeeAssignmentsDueForReminder(reminderIntervalDays: number): Promise<FeeAssignment[]>;
  getOverdueFeeAssignments(asOf: Date): Promise<FeeAssignment[]>;
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

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
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
        .where(and(eq(events.teamId, teamId), gt(events.endTime, now)))
        .orderBy(events.startTime);
    } else {
      events_data = await db
        .select()
        .from(events)
        .where(gt(events.endTime, now))
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
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }


  // Match result methods
  async getMatchResult(id: string): Promise<MatchResult | undefined> {
    const [matchResult] = await db.select().from(matchResults).where(eq(matchResults.id, id));
    return matchResult || undefined;
  }

  async getMatchResults(): Promise<any[]> {
    return await db
      .select({
        id: matchResults.id,
        fixtureId: matchResults.fixtureId,
        teamId: matchResults.teamId,
        homeTeamGoals: matchResults.homeTeamGoals,
        awayTeamGoals: matchResults.awayTeamGoals,
        isHomeFixture: matchResults.isHomeFixture,
        result: matchResults.result,
        playerStats: matchResults.playerStats,
        createdAt: matchResults.createdAt,
        opponent: events.opponent,
        startTime: events.startTime,
        name: events.name
      })
      .from(matchResults)
      .leftJoin(events, eq(matchResults.fixtureId, events.id))
      .orderBy(events.startTime);
  }

  async getMatchResultsByTeamId(teamId: string): Promise<any[]> {
    return await db
      .select({
        id: matchResults.id,
        fixtureId: matchResults.fixtureId,
        teamId: matchResults.teamId,
        homeTeamGoals: matchResults.homeTeamGoals,
        awayTeamGoals: matchResults.awayTeamGoals,
        isHomeFixture: matchResults.isHomeFixture,
        result: matchResults.result,
        playerStats: matchResults.playerStats,
        createdAt: matchResults.createdAt,
        opponent: events.opponent,
        startTime: events.startTime,
        name: events.name
      })
      .from(matchResults)
      .leftJoin(events, eq(matchResults.fixtureId, events.id))
      .where(eq(matchResults.teamId, teamId))
      .orderBy(events.startTime);
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

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async deletePlayersByParentId(parentId: string): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.parentId, parentId)).returning();
    return result.length > 0;
  }

  // Fee methods
  async getFee(id: string): Promise<Fee | undefined> {
    const [fee] = await db.select().from(fees).where(eq(fees.id, id));
    return fee;
  }

  async getFeesByClubId(clubId: string): Promise<Fee[]> {
    return db.select().from(fees).where(eq(fees.clubId, clubId));
  }

  async createFee(insertFee: InsertFee): Promise<Fee> {
    const [fee] = await db.insert(fees).values(insertFee).returning();
    return fee;
  }

  async updateFee(id: string, updates: Partial<Fee>): Promise<Fee | undefined> {
    const [fee] = await db
      .update(fees)
      .set(updates)
      .where(eq(fees.id, id))
      .returning();
    return fee;
  }

  async deleteFee(id: string): Promise<boolean> {
    const result = await db.delete(fees).where(eq(fees.id, id)).returning();
    return result.length > 0;
  }

  // Fee assignment methods
  async getFeeAssignment(id: string): Promise<FeeAssignment | undefined> {
    const [assignment] = await db.select().from(feeAssignments).where(eq(feeAssignments.id, id));
    return assignment;
  }

  async getFeeAssignmentsByFeeId(feeId: string): Promise<FeeAssignment[]> {
    return db.select().from(feeAssignments).where(eq(feeAssignments.feeId, feeId));
  }

  async getFeeAssignmentsByPlayerId(playerId: string): Promise<FeeAssignment[]> {
    return db.select().from(feeAssignments).where(eq(feeAssignments.playerId, playerId));
  }

  async getFeeAssignmentsByPlayerIds(playerIds: string[]): Promise<FeeAssignment[]> {
    if (playerIds.length === 0) return [];
    return db.select().from(feeAssignments).where(inArray(feeAssignments.playerId, playerIds));
  }

  async createFeeAssignment(insertFeeAssignment: InsertFeeAssignment): Promise<FeeAssignment> {
    const [assignment] = await db.insert(feeAssignments).values(insertFeeAssignment).returning();
    return assignment;
  }

  async createFeeAssignments(insertFeeAssignments: InsertFeeAssignment[]): Promise<FeeAssignment[]> {
    if (insertFeeAssignments.length === 0) return [];
    return db.insert(feeAssignments).values(insertFeeAssignments).returning();
  }

  async updateFeeAssignment(id: string, updates: Partial<FeeAssignment>): Promise<FeeAssignment | undefined> {
    const [assignment] = await db
      .update(feeAssignments)
      .set(updates)
      .where(eq(feeAssignments.id, id))
      .returning();
    return assignment;
  }

  // Payment methods
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByFeeAssignmentId(feeAssignmentId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.feeAssignmentId, feeAssignmentId));
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.paidByUserId, userId));
  }

  async getPaymentByProviderSessionId(providerSessionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.providerSessionId, providerSessionId));
    return payment;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Fee schedule methods
  async getFeeSchedule(clubId: string, season: string): Promise<FeeSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(feeSchedules)
      .where(and(eq(feeSchedules.clubId, clubId), eq(feeSchedules.season, season)));
    return schedule;
  }

  async getFeeSchedulesByClubId(clubId: string): Promise<FeeSchedule[]> {
    return db.select().from(feeSchedules).where(eq(feeSchedules.clubId, clubId));
  }

  async upsertFeeSchedule(insertFeeSchedule: InsertFeeSchedule): Promise<FeeSchedule> {
    const existing = await this.getFeeSchedule(insertFeeSchedule.clubId, insertFeeSchedule.season);
    if (existing) {
      const [updated] = await db
        .update(feeSchedules)
        .set({ ...insertFeeSchedule, updatedAt: new Date() })
        .where(eq(feeSchedules.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(feeSchedules).values(insertFeeSchedule).returning();
    return created;
  }

  // Fee enrollment methods
  async getFeeEnrollment(id: string): Promise<FeeEnrollment | undefined> {
    const [enrollment] = await db.select().from(feeEnrollments).where(eq(feeEnrollments.id, id));
    return enrollment;
  }

  async getFeeEnrollmentByPlayerAndSeason(playerId: string, season: string): Promise<FeeEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(feeEnrollments)
      .where(and(eq(feeEnrollments.playerId, playerId), eq(feeEnrollments.season, season)));
    return enrollment;
  }

  async getFeeEnrollmentsByPlayerId(playerId: string): Promise<FeeEnrollment[]> {
    return db.select().from(feeEnrollments).where(eq(feeEnrollments.playerId, playerId));
  }

  async getFeeEnrollmentsByClubAndSeason(clubId: string, season: string): Promise<FeeEnrollment[]> {
    return db
      .select()
      .from(feeEnrollments)
      .where(and(eq(feeEnrollments.clubId, clubId), eq(feeEnrollments.season, season)));
  }

  async getFeeEnrollmentsByTeamId(teamId: string): Promise<FeeEnrollment[]> {
    return db.select().from(feeEnrollments).where(eq(feeEnrollments.teamId, teamId));
  }

  async createFeeEnrollment(insertFeeEnrollment: InsertFeeEnrollment): Promise<FeeEnrollment> {
    const [enrollment] = await db.insert(feeEnrollments).values(insertFeeEnrollment).returning();
    return enrollment;
  }

  async updateFeeEnrollment(id: string, updates: Partial<FeeEnrollment>): Promise<FeeEnrollment | undefined> {
    const [enrollment] = await db
      .update(feeEnrollments)
      .set(updates)
      .where(eq(feeEnrollments.id, id))
      .returning();
    return enrollment;
  }

  // Reminder service support: assignments not yet paid, due soon/overdue, not reminded recently
  async getFeeAssignmentsDueForReminder(reminderIntervalDays: number): Promise<FeeAssignment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - reminderIntervalDays);

    return db
      .select()
      .from(feeAssignments)
      .where(
        and(
          inArray(feeAssignments.status, ["pending", "overdue", "partial"]),
          or(isNull(feeAssignments.lastReminderSentAt), lt(feeAssignments.lastReminderSentAt, cutoff))
        )
      );
  }

  async getOverdueFeeAssignments(asOf: Date): Promise<FeeAssignment[]> {
    const dueAssignments = await db
      .select({ id: fees.id, dueDate: fees.dueDate })
      .from(fees)
      .where(lte(fees.dueDate, asOf));
    const overdueFeeIds = dueAssignments.map((f) => f.id);
    if (overdueFeeIds.length === 0) return [];

    return db
      .select()
      .from(feeAssignments)
      .where(
        and(
          inArray(feeAssignments.feeId, overdueFeeIds),
          inArray(feeAssignments.status, ["pending", "partial"])
        )
      );
  }
}

export const storage = new DatabaseStorage();