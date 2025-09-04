import { users, clubs, teams, players, fixtures, posts, awards, type User, type Club, type Team, type Player, type Fixture, type Post, type Award, type InsertUser, type InsertClub, type InsertTeam, type InsertPlayer, type InsertFixture, type InsertPost, type InsertAward } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(insertUser: InsertUser): Promise<User>;
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

  // Fixture methods
  getFixture(id: string): Promise<Fixture | undefined>;
  getFixtures(): Promise<Fixture[]>;
  getFixturesByTeamId(teamId: string): Promise<Fixture[]>;
  getUpcomingFixtures(teamId?: string): Promise<Fixture[]>;
  createFixture(insertFixture: InsertFixture): Promise<Fixture>;
  updateFixture(id: string, updates: Partial<Fixture>): Promise<Fixture | undefined>;

  // Post methods
  getPost(id: string): Promise<Post | undefined>;
  getPosts(): Promise<Post[]>;
  getPostsByTeamId(teamId: string): Promise<Post[]>;
  getPostsByClubId(clubId: string): Promise<Post[]>;
  createPost(insertPost: InsertPost): Promise<Post>;

  // Award methods
  getAwards(): Promise<Award[]>;
  getAwardsByTeamId(teamId: string): Promise<Award[]>;
  createAward(insertAward: InsertAward): Promise<Award>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Club methods
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async getClubByCode(code: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.code, code));
    return club || undefined;
  }

  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs);
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(insertClub)
      .returning();
    return club;
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

  // Fixture methods
  async getFixture(id: string): Promise<Fixture | undefined> {
    const [fixture] = await db.select().from(fixtures).where(eq(fixtures.id, id));
    return fixture || undefined;
  }

  async getFixtures(): Promise<Fixture[]> {
    return await db.select().from(fixtures);
  }

  async getFixturesByTeamId(teamId: string): Promise<Fixture[]> {
    return await db.select().from(fixtures).where(eq(fixtures.teamId, teamId));
  }

  async getUpcomingFixtures(teamId?: string): Promise<Fixture[]> {
    const now = new Date();
    if (teamId) {
      return await db
        .select()
        .from(fixtures)
        .where(and(eq(fixtures.teamId, teamId), gt(fixtures.startTime, now)))
        .orderBy(fixtures.startTime);
    }
    return await db
      .select()
      .from(fixtures)
      .where(gt(fixtures.startTime, now))
      .orderBy(fixtures.startTime);
  }

  async createFixture(insertFixture: InsertFixture): Promise<Fixture> {
    const [fixture] = await db
      .insert(fixtures)
      .values(insertFixture)
      .returning();
    return fixture;
  }

  async updateFixture(id: string, updates: Partial<Fixture>): Promise<Fixture | undefined> {
    const [fixture] = await db
      .update(fixtures)
      .set(updates)
      .where(eq(fixtures.id, id))
      .returning();
    return fixture || undefined;
  }

  // Post methods
  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  async getPostsByTeamId(teamId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.teamId, teamId));
  }

  async getPostsByClubId(clubId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.clubId, clubId));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
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
}

export const storage = new DatabaseStorage();