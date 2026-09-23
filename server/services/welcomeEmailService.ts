import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { getEmailProvider } from "../email";
import { users } from "@shared/schema";
import { buildWelcomeEmail } from "../email/welcome-template";

function getApplicationUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.NODE_ENV === "production") return "https://team-hub-uk.replit.app";
  return "http://localhost:5000";
}

export async function sendWelcomeEmailOnce(userId: string): Promise<boolean> {
  const claimedAt = new Date();
  const [user] = await db
    .update(users)
    .set({ welcomeEmailSentAt: claimedAt })
    .where(and(eq(users.id, userId), isNull(users.welcomeEmailSentAt)))
    .returning();

  if (!user) return false;

  const result = await getEmailProvider().sendEmail({
    to: user.email,
    ...buildWelcomeEmail(user.firstName, getApplicationUrl()),
  });

  if (!result.success) {
    await db
      .update(users)
      .set({ welcomeEmailSentAt: null })
      .where(and(eq(users.id, userId), eq(users.welcomeEmailSentAt, claimedAt)));
    console.error("[welcome-email] Unable to send welcome email:", result.error);
    return false;
  }

  return true;
}
