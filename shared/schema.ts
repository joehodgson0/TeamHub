import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  roles: z.array(z.enum(["coach", "parent"])),
  clubId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export const registerUserSchema = userSchema.pick({
  email: true,
  password: true,
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
  managerId: z.string(),
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

// Fixture schema
export const fixtureSchema = z.object({
  id: z.string(),
  type: z.enum(["match", "friendly", "tournament", "training", "social"]),
  name: z.string(),
  opponent: z.string().optional(),
  location: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  additionalInfo: z.string().optional(),
  teamId: z.string(),
  result: z.object({
    homeScore: z.number(),
    awayScore: z.number(),
    outcome: z.enum(["W", "L", "D"]),
  }).optional(),
  availability: z.record(z.string(), z.enum(["available", "unavailable", "pending"])).default({}),
  createdAt: z.date().default(() => new Date()),
});

export const createFixtureSchema = fixtureSchema.pick({
  type: true,
  name: true,
  opponent: true,
  location: true,
  startTime: true,
  endTime: true,
  additionalInfo: true,
});

// Post schema
export const postSchema = z.object({
  id: z.string(),
  type: z.enum(["kit_request", "player_request", "announcement", "event"]),
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
});

// Award schema
export const awardSchema = z.object({
  id: z.string(),
  title: z.string(),
  recipient: z.string(),
  recipientId: z.string(),
  teamId: z.string(),
  month: z.string(),
  year: z.number(),
  createdAt: z.date().default(() => new Date()),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type RoleSelection = z.infer<typeof roleSelectionSchema>;
export type Club = z.infer<typeof clubSchema>;
export type ClubAssociation = z.infer<typeof clubAssociationSchema>;
export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type TeamAssociation = z.infer<typeof teamAssociationSchema>;
export type Player = z.infer<typeof playerSchema>;
export type AddPlayer = z.infer<typeof addPlayerSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type CreateFixture = z.infer<typeof createFixtureSchema>;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type Award = z.infer<typeof awardSchema>;
