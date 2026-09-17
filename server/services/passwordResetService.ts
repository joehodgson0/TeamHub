import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { passwordResetTokens, sessions, users } from "@shared/schema";
import { getEmailProvider } from "../email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getApplicationUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.NODE_ENV === "production") return "https://team-hub-uk.replit.app";
  return "http://localhost:5000";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function buildResetEmail(resetUrl: string, firstName?: string | null) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const htmlGreeting = escapeHtml(greeting);
  const text = `${greeting}

We received a request to reset your TeamHub password.

Reset your password: ${resetUrl}

This link expires in 1 hour and can only be used once. If you did not request this, you can safely ignore this email.

TeamHub`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto">
      <h1 style="color:#2563eb">Reset your TeamHub password</h1>
      <p>${htmlGreeting}</p>
      <p>We received a request to reset your TeamHub password.</p>
      <p style="margin:28px 0">
        <a href="${resetUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
          Reset password
        </a>
      </p>
      <p>This link expires in 1 hour and can only be used once.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>TeamHub</p>
    </div>`;

  return { text, html };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);

  // Always do the same outward flow for unknown and OAuth-only accounts.
  if (!user?.password) return;

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });

  const resetUrl = `${getApplicationUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const appResetUrl = `teamhub://reset-password?token=${encodeURIComponent(token)}`;
  const content = buildResetEmail(resetUrl, user.firstName);
  content.html = content.html.replace(
    "<p>This link expires",
    `<p><a href="${appResetUrl}" style="color:#2563eb">Open in the TeamHub app</a></p><p>This link expires`,
  );
  const result = await getEmailProvider().sendEmail({
    to: user.email,
    subject: "Reset your TeamHub password",
    ...content,
  });

  if (!result.success) {
    console.error("[password-reset] Unable to send reset email:", result.error);
  }
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  const now = new Date();
  const tokenHash = hashToken(token);

  return db.transaction(async (tx: any) => {
    const [record] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ))
      .returning();

    if (!record) return false;

    const hashedPassword = await bcrypt.hash(password, 12);
    await tx
      .update(users)
      .set({ password: hashedPassword, updatedAt: now })
      .where(eq(users.id, record.userId));

    await tx
      .delete(sessions)
      .where(sql`${sessions.sess}->>'userId' = ${record.userId}`);

    await tx
      .delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.userId, record.userId),
        sql`${passwordResetTokens.tokenHash} <> ${tokenHash}`,
      ));

    return true;
  });
}