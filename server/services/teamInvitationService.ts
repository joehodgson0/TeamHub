import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { getEmailProvider } from "../email";
import { playerGuardians, players, teamInvitations, teams, users } from "@shared/schema";
import { dependentDateKey, normalizeDependentName } from "./dependentIdentity";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function getApplicationUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.NODE_ENV === "production") return "https://team-hub-uk.replit.app";
  return "http://localhost:5000";
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character] || character);

export async function sendTeamInvitation(params: {
  teamId: string;
  teamName: string;
  email: string;
  role: "parent" | "coach";
  invitedBy: string;
  inviterName: string;
}) {
  const email = params.email.trim().toLowerCase();
  await db.delete(teamInvitations).where(and(
    eq(teamInvitations.teamId, params.teamId),
    eq(teamInvitations.email, email),
    eq(teamInvitations.role, params.role),
    isNull(teamInvitations.acceptedAt),
  ));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  await db.insert(teamInvitations).values({
    tokenHash: hashToken(token),
    teamId: params.teamId,
    email,
    role: params.role,
    invitedBy: params.invitedBy,
    expiresAt,
  });

  const webUrl = `${getApplicationUrl()}/team-invite?token=${encodeURIComponent(token)}`;
  const appUrl = `teamhub://team-invite?token=${encodeURIComponent(token)}`;
  const roleLabel = params.role === "coach" ? "coach" : "parent or guardian";
  const safeTeamName = params.teamName.replace(/[\r\n]+/g, " ").trim();
  const subject = `Join ${safeTeamName} on TeamHub`;
  const text = `${params.inviterName} invited you to join ${params.teamName} as a ${roleLabel} on TeamHub.\n\nAccept invitation: ${webUrl}\nOpen in the TeamHub app: ${appUrl}\n\nThis single-use link expires in 7 days and must be accepted using ${email}.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto">
    <h1 style="color:#2563eb">Join ${escapeHtml(params.teamName)}</h1>
    <p>${escapeHtml(params.inviterName)} invited you to join as a ${roleLabel} on TeamHub.</p>
    <p style="margin:28px 0"><a href="${webUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Accept invitation</a></p>
    <p><a href="${appUrl}" style="color:#2563eb">Open in the TeamHub app</a></p>
    <p>This single-use link expires in 7 days and must be accepted using ${escapeHtml(email)}.</p>
  </div>`;

  const result = await getEmailProvider().sendEmail({ to: email, subject, text, html });
  if (!result.success) {
    await db.delete(teamInvitations).where(eq(teamInvitations.tokenHash, hashToken(token)));
    throw new Error(result.error || "Unable to send invitation email");
  }
  return { expiresAt };
}

export async function getTeamInvitation(token: string) {
  const [invitation] = await db.select().from(teamInvitations).where(and(
    eq(teamInvitations.tokenHash, hashToken(token)),
    isNull(teamInvitations.acceptedAt),
    gt(teamInvitations.expiresAt, new Date()),
  )).limit(1);
  if (!invitation) return null;
  const [team] = await db.select().from(teams).where(eq(teams.id, invitation.teamId)).limit(1);
  return team ? { invitation, team } : null;
}

export async function acceptTeamInvitation(params: {
  token: string;
  userId: string;
  dependentName?: string;
  dependentDateOfBirth?: Date;
}) {
  const tokenHash = hashToken(params.token);
  return db.transaction(async (tx: any) => {
    const [invitation] = await tx.select().from(teamInvitations).where(and(
      eq(teamInvitations.tokenHash, tokenHash),
      isNull(teamInvitations.acceptedAt),
      gt(teamInvitations.expiresAt, new Date()),
    )).limit(1);
    if (!invitation) throw new Error("This invitation is invalid, expired, or has already been used");

    const [user] = await tx.select().from(users).where(eq(users.id, params.userId)).limit(1);
    const [team] = await tx.select().from(teams).where(eq(teams.id, invitation.teamId)).limit(1);
    if (!user || !team) throw new Error("The invited team or user no longer exists");
    if (user.email.trim().toLowerCase() !== invitation.email) throw new Error(`Sign in using ${invitation.email} to accept this invitation`);
    if (user.clubId && user.clubId !== team.clubId) throw new Error("This account already belongs to a different club");

    const [claimed] = await tx.update(teamInvitations).set({ acceptedAt: new Date() }).where(and(
      eq(teamInvitations.tokenHash, tokenHash),
      isNull(teamInvitations.acceptedAt),
    )).returning();
    if (!claimed) throw new Error("This invitation has already been used");

    const roles = [...new Set([...(user.roles || []), invitation.role])];
    if (invitation.role === "coach") {
      await tx.update(users).set({
        roles,
        clubId: team.clubId,
        teamIds: [...new Set([...(user.teamIds || []), team.id])],
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));
      return { role: invitation.role, team, player: undefined, linkedExistingDependent: false };
    }

    if (!params.dependentName?.trim() || !params.dependentDateOfBirth) {
      throw new Error("Enter the dependent's name and date of birth");
    }
    await tx.update(users).set({ roles, clubId: team.clubId, updatedAt: new Date() }).where(eq(users.id, user.id));

    const teamPlayers = await tx.select().from(players).where(eq(players.teamId, team.id));
    const normalizedName = normalizeDependentName(params.dependentName);
    const dateKey = dependentDateKey(params.dependentDateOfBirth);
    const existing = teamPlayers.find((player: any) =>
      normalizeDependentName(player.name) === normalizedName && dependentDateKey(player.dateOfBirth) === dateKey,
    );
    if (existing) {
      await tx.insert(playerGuardians).values({ playerId: existing.id, userId: user.id }).onConflictDoNothing();
      return { role: invitation.role, team, player: existing, linkedExistingDependent: true };
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const [player] = await tx.insert(players).values({
      id: playerId,
      name: params.dependentName.trim().replace(/\s+/g, " "),
      dateOfBirth: params.dependentDateOfBirth,
      teamId: team.id,
      parentId: user.id,
      attendance: 0,
      totalEvents: 0,
    }).returning();
    await tx.insert(playerGuardians).values({ playerId, userId: user.id }).onConflictDoNothing();
    await tx.update(teams).set({ playerIds: [...new Set([...(team.playerIds || []), playerId])] }).where(eq(teams.id, team.id));
    return { role: invitation.role, team, player, linkedExistingDependent: false };
  });
}
