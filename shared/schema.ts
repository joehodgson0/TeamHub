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

// Emergency contact schema
export const emergencyContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobilePhone: z.string().min(1, "Mobile phone is required"),
  homePhone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

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
  // Extended fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  faNumber: z.string().optional(),
  streetAddress1: z.string().optional(),
  streetAddress2: z.string().optional(),
  streetAddress3: z.string().optional(),
  streetAddress4: z.string().optional(),
  townCity: z.string().optional(),
  countyRegion: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
  consentPhotograph: z.string().optional(),
  consentSocialMedia: z.string().optional(),
  consentMedical: z.string().optional(),
  additionalRequirements: z.string().optional(),
  declaredLearningDisability: z.string().optional(),
  additionalInformation: z.string().optional(),
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  doctorAddress: z.string().optional(),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
});

export const addPlayerSchema = playerSchema.pick({
  name: true,
  dateOfBirth: true,
}).extend({
  teamCode: z.string().length(8, "Team code must be 8 characters"),
});

// Dependent details form schema (used during registration and for editing)
export const dependentDetailsSchema = z.object({
  // Basic
  teamCode: z.string().length(8, "Team code must be 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  faNumber: z.string().optional(),
  // Address
  streetAddress1: z.string().optional(),
  streetAddress2: z.string().optional(),
  streetAddress3: z.string().optional(),
  streetAddress4: z.string().optional(),
  townCity: z.string().min(1, "Town/City is required"),
  countyRegion: z.string().min(1, "County/Region is required"),
  postCode: z.string().min(1, "Post code is required"),
  country: z.string().min(1, "Country is required"),
  // Consents
  consentPhotograph: z.string().min(1, "Please select an option"),
  consentSocialMedia: z.string().min(1, "Please select an option"),
  consentMedical: z.string().min(1, "Please select an option"),
  // Medical/Additional
  additionalRequirements: z.string().optional(),
  declaredLearningDisability: z.string().optional(),
  additionalInformation: z.string().optional(),
  // Doctor
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  doctorAddress: z.string().optional(),
  // Emergency contacts
  emergencyContacts: z.array(emergencyContactSchema).min(1, "At least one emergency contact is required"),
});

export type DependentDetails = z.infer<typeof dependentDetailsSchema>;

// Update dependent schema (no teamCode required for updates)
export const updateDependentSchema = dependentDetailsSchema.omit({ teamCode: true }).partial().extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type UpdateDependent = z.infer<typeof updateDependentSchema>;

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
}).refine((data) => data.content.trim().length > 0, {
  message: "Post content cannot be empty",
  path: ["content"]
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
  // Extended profile fields
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  faNumber: varchar("fa_number"),
  streetAddress1: varchar("street_address_1"),
  streetAddress2: varchar("street_address_2"),
  streetAddress3: varchar("street_address_3"),
  streetAddress4: varchar("street_address_4"),
  townCity: varchar("town_city"),
  countyRegion: varchar("county_region"),
  postCode: varchar("post_code"),
  country: varchar("country"),
  consentPhotograph: varchar("consent_photograph"),
  consentSocialMedia: varchar("consent_social_media"),
  consentMedical: varchar("consent_medical"),
  additionalRequirements: text("additional_requirements"),
  declaredLearningDisability: text("declared_learning_disability"),
  additionalInformation: text("additional_information"),
  doctorName: varchar("doctor_name"),
  doctorPhone: varchar("doctor_phone"),
  doctorAddress: varchar("doctor_address"),
  emergencyContacts: json("emergency_contacts").$type<EmergencyContact[]>(),
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

// Fee category type
export const feeCategoryEnum = z.enum(["subscription", "kit", "tournament", "social", "other"]);
export type FeeCategory = z.infer<typeof feeCategoryEnum>;

// Fee status type
export const feeAssignmentStatusEnum = z.enum(["pending", "paid", "overdue", "partial", "cancelled"]);
export type FeeAssignmentStatus = z.infer<typeof feeAssignmentStatusEnum>;

// Payment status type
export const paymentStatusEnum = z.enum(["pending", "succeeded", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

// Payment provider type
export const paymentProviderEnum = z.enum(["stripe", "sumup", "manual"]);
export type PaymentProvider = z.infer<typeof paymentProviderEnum>;

// Fee schema - Zod validation
export const feeSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  name: z.string().min(1, "Fee name is required"),
  description: z.string().optional(),
  amount: z.number().int().positive("Amount must be positive"), // In pence
  currency: z.string().default("gbp"),
  dueDate: z.date(),
  category: feeCategoryEnum,
  isRecurring: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.date().default(() => new Date()),
});

export const createFeeSchema = feeSchema.pick({
  name: true,
  description: true,
  amount: true,
  dueDate: true,
  category: true,
  isRecurring: true,
});

// Fee assignment schema - Zod validation
export const feeAssignmentSchema = z.object({
  id: z.string(),
  feeId: z.string(),
  playerId: z.string(),
  teamId: z.string(),
  status: feeAssignmentStatusEnum.default("pending"),
  amountDue: z.number().int().positive(),
  amountPaid: z.number().int().default(0),
  paidAt: z.date().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Payment schema - Zod validation
export const paymentSchema = z.object({
  id: z.string(),
  feeAssignmentId: z.string(),
  amount: z.number().int().positive(),
  provider: paymentProviderEnum,
  providerSessionId: z.string(),
  providerPaymentId: z.string().nullable().optional(),
  status: paymentStatusEnum.default("pending"),
  paidByUserId: z.string(),
  receiptUrl: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Fees table - Drizzle definition
export const fees = pgTable("fees", {
  id: varchar("id").primaryKey(),
  clubId: varchar("club_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // In pence (e.g., 2000 = £20.00)
  currency: varchar("currency", { length: 3 }).notNull().default("gbp"),
  dueDate: timestamp("due_date").notNull(),
  category: varchar("category").notNull(), // subscription, kit, tournament, social, other
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Fee assignments table - Links fees to players
export const feeAssignments = pgTable("fee_assignments", {
  id: varchar("id").primaryKey(),
  feeId: varchar("fee_id").notNull(),
  playerId: varchar("player_id").notNull(),
  teamId: varchar("team_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue, partial, cancelled
  amountDue: integer("amount_due").notNull(),
  amountPaid: integer("amount_paid").notNull().default(0),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payments table - Individual payment transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey(),
  feeAssignmentId: varchar("fee_assignment_id").notNull(),
  amount: integer("amount").notNull(), // In pence
  provider: varchar("provider").notNull(), // stripe, sumup, manual
  providerSessionId: varchar("provider_session_id").notNull(),
  providerPaymentId: varchar("provider_payment_id"),
  status: varchar("status").notNull().default("pending"), // pending, succeeded, failed, refunded
  paidByUserId: varchar("paid_by_user_id").notNull(),
  receiptUrl: varchar("receipt_url"),
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
export const insertFeeSchema = createInsertSchema(fees).omit({ createdAt: true });
export const insertFeeAssignmentSchema = createInsertSchema(feeAssignments).omit({ createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ createdAt: true });

// Type exports for Replit Auth
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type RoleSelection = z.infer<typeof roleSelectionSchema>;
export type Club = z.infer<typeof clubSchema>;
export type ClubAssociation = z.infer<typeof clubAssociationSchema>;
export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type TeamAssociation = z.infer<typeof teamAssociationSchema>;
export type Player = typeof players.$inferSelect;
export type AddPlayer = z.infer<typeof addPlayerSchema>;
export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
// Legacy types for backward compatibility
export type Fixture = Event;
export type CreateFixture = CreateEvent;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type MatchResult = typeof matchResults.$inferSelect;

// Fee types
export type Fee = typeof fees.$inferSelect;
export type CreateFee = z.infer<typeof createFeeSchema>;
export type FeeAssignment = typeof feeAssignments.$inferSelect;
export type Payment = typeof payments.$inferSelect;

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
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type InsertFeeAssignment = z.infer<typeof insertFeeAssignmentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
