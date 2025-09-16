import { z } from "zod";
import { pgTable, varchar, text, timestamp, integer, json, serial, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from 'drizzle-orm';

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User schema - updated for Replit Auth
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  roles: z.array(z.enum(["coach", "parent"])).default([]),
  clubId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const roleSelectionSchema = z.object({
  roles: z.array(z.enum(["coach", "parent"])).min(1, "Please select at least one role"),
});

// Club schema
export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().length(8),
  established: z.string().optional(),
  totalTeams: z.number().default(0),
  totalPlayers: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
});

export const clubAssociationSchema = z.object({
  clubCode: z.string().length(8, "Club code must be 8 characters"),
});

// Team schema  
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  ageGroup: z.enum(["U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U21"]),
  code: z.string().length(8),
  clubId: z.string(),
  playerIds: z.array(z.string()).default([]),
  wins: z.number().default(0),
  draws: z.number().default(0),
  losses: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
});

export const createTeamSchema = teamSchema.pick({
  name: true,
  ageGroup: true,
});

export const teamAssociationSchema = z.object({
  teamCode: z.string().length(8, "Team code must be 8 characters"),
});

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateOfBirth: z.date(),
  teamId: z.string(),
  parentId: z.string(),
  attendance: z.number().default(0),
  totalEvents: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
});

export const addPlayerSchema = playerSchema.pick({
  name: true,
  dateOfBirth: true,
}).extend({
  teamCode: z.string().length(8, "Team code must be 8 characters"),
});

// Event schema
export const eventSchema = z.object({
  id: z.string(),
  type: z.enum(["match", "tournament", "training", "social"]),
  friendly: z.boolean().default(false),
  name: z.string().optional(),
  opponent: z.string().optional(),
  location: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  additionalInfo: z.string().optional(),
  teamId: z.string(),
  homeAway: z.enum(["home", "away"]).optional(),
  result: z.object({
    homeScore: z.number(),
    awayScore: z.number(),
    outcome: z.enum(["W", "L", "D"]),
  }).optional(),
  availability: z.record(z.string(), z.enum(["available", "unavailable", "pending"])).default({}),
  createdAt: z.date().default(() => new Date()),
});

export const createEventSchema = eventSchema.pick({
  type: true,
  friendly: true,
  name: true,
  opponent: true,
  location: true,
  startTime: true,
  endTime: true,
  additionalInfo: true,
  homeAway: true,
});

// Post schema
export const postSchema = z.object({
  id: z.string(),
  type: z.enum(["kit_request", "player_request", "announcement"]),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  teamId: z.string().optional(),
  clubId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const createPostSchema = postSchema.pick({
  type: true,
  title: true,
  content: true,
}).extend({
  scope: z.enum(["team", "club"])
});


// Drizzle table definitions
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Keep existing ID type for compatibility
  email: varchar("email").notNull().unique(), // Match existing NOT NULL constraint
  password: varchar("password"), // For username/password auth (nullable for Google auth users)
  firstName: varchar("first_name"), // For Replit Auth or traditional registration
  lastName: varchar("last_name"), // For Replit Auth or traditional registration
  profileImageUrl: varchar("profile_image_url"), // For Replit Auth
  roles: json("roles").$type<("coach" | "parent")[]>().notNull().default([]),
  clubId: varchar("club_id"),
  teamIds: json("team_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  established: varchar("established"),
  totalTeams: integer("total_teams").notNull().default(0),
  totalPlayers: integer("total_players").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  ageGroup: varchar("age_group").notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  clubId: varchar("club_id").notNull(),
  playerIds: json("player_ids").$type<string[]>().notNull().default([]),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  teamId: varchar("team_id").notNull(),
  parentId: varchar("parent_id").notNull(),
  attendance: integer("attendance").notNull().default(0),
  totalEvents: integer("total_events").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey(),
  type: varchar("type").notNull(),
  friendly: boolean("friendly").notNull().default(false),
  name: varchar("name"),
  opponent: varchar("opponent"),
  location: varchar("location").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  additionalInfo: text("additional_info"),
  teamId: varchar("team_id").notNull(),
  homeAway: varchar("home_away"),
  result: json("result").$type<{homeScore: number; awayScore: number; outcome: "W" | "L" | "D"}>(),
  availability: json("availability").$type<Record<string, "available" | "unavailable" | "pending">>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name").notNull(),
  authorRole: varchar("author_role").notNull(),
  teamId: varchar("team_id"),
  clubId: varchar("club_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const matchResults = pgTable("match_results", {
  id: varchar("id").primaryKey(),
  fixtureId: varchar("fixture_id").notNull(),
  teamId: varchar("team_id").notNull(),
  homeTeamGoals: integer("home_team_goals").notNull(),
  awayTeamGoals: integer("away_team_goals").notNull(),
  isHomeFixture: boolean("is_home_fixture").notNull(),
  result: varchar("result").notNull(), // "win", "lose", "draw"
  playerStats: json("player_stats").$type<Record<string, { goals: number; assists: number }>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true });
export const insertClubSchema = createInsertSchema(clubs).omit({ createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ createdAt: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ createdAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ createdAt: true });
export const insertMatchResultSchema = createInsertSchema(matchResults).omit({ createdAt: true });

// Type exports for Replit Auth
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type RoleSelection = z.infer<typeof roleSelectionSchema>;
export type Club = z.infer<typeof clubSchema>;
export type ClubAssociation = z.infer<typeof clubAssociationSchema>;
export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type TeamAssociation = z.infer<typeof teamAssociationSchema>;
export type Player = z.infer<typeof playerSchema>;
export type AddPlayer = z.infer<typeof addPlayerSchema>;
export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
// Legacy types for backward compatibility
export type Fixture = Event;
export type CreateFixture = CreateEvent;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type MatchResult = typeof matchResults.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
// Legacy type for backward compatibility
export type InsertFixture = InsertEvent;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;
