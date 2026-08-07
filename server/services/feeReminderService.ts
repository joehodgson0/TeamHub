import { storage } from "../storage";
import { getEmailProvider } from "../email";
import type { FeeAssignment } from "@shared/schema";

const REMINDER_INTERVAL_DAYS = 7; // minimum gap between reminder emails for the same assignment
const REMINDER_WINDOW_DAYS = 7; // start reminding this many days before the due date

function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function buildReminderEmail(params: {
  parentName: string;
  playerName: string;
  feeName: string;
  amount: number;
  dueDate: Date;
  isOverdue: boolean;
  payUrl: string;
}) {
  const { parentName, playerName, feeName, amount, dueDate, isOverdue, payUrl } = params;
  const dueDateStr = dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const subject = isOverdue
    ? `Overdue payment for ${playerName} - ${feeName}`
    : `Payment reminder for ${playerName} - ${feeName}`;

  const text = isOverdue
    ? `Hi ${parentName},\n\nThe payment of ${formatPounds(amount)} for ${playerName} (${feeName}) was due on ${dueDateStr} and is now overdue.\n\nPlease make payment as soon as possible: ${payUrl}\n\nThanks,\nTeamHub`
    : `Hi ${parentName},\n\nA payment of ${formatPounds(amount)} for ${playerName} (${feeName}) is due on ${dueDateStr}.\n\nYou can pay here: ${payUrl}\n\nThanks,\nTeamHub`;

  return { subject, text };
}

/** Send (or re-send) a reminder email for a single fee assignment. Used by the
 * scheduled background job and by admins manually sending a "chaser" email. */
export async function sendReminderForAssignment(assignmentId: string): Promise<{ success: boolean; error?: string }> {
  const assignment = await storage.getFeeAssignment(assignmentId);
  if (!assignment) return { success: false, error: "Fee assignment not found" };
  if (assignment.status === "paid" || assignment.status === "cancelled") {
    return { success: false, error: "This fee assignment does not require a reminder" };
  }

  const [fee, player] = await Promise.all([
    storage.getFee(assignment.feeId),
    storage.getPlayer(assignment.playerId),
  ]);
  if (!fee || !player) return { success: false, error: "Related fee or player not found" };

  const parent = await storage.getUser(player.parentId);
  if (!parent?.email) return { success: false, error: "Parent has no email on file" };

  const appUrl = process.env.APP_URL || "http://localhost:5000";
  const payUrl = `${appUrl}/payments?assignment=${assignment.id}`;
  const isOverdue = new Date(fee.dueDate) < new Date();

  const { subject, text } = buildReminderEmail({
    parentName: parent.firstName || "there",
    playerName: player.name,
    feeName: fee.name,
    amount: assignment.amountDue - assignment.amountPaid,
    dueDate: new Date(fee.dueDate),
    isOverdue,
    payUrl,
  });

  const result = await getEmailProvider().sendEmail({ to: parent.email, subject, text });
  if (result.success) {
    await storage.updateFeeAssignment(assignment.id, {
      lastReminderSentAt: new Date(),
      reminderCount: (assignment.reminderCount || 0) + 1,
    });
  }
  return result;
}

/** Mark any pending/partial assignments whose fee due date has passed as "overdue". */
async function markOverdueAssignments(): Promise<number> {
  const overdue = await storage.getOverdueFeeAssignments(new Date());
  for (const assignment of overdue) {
    if (assignment.status !== "overdue") {
      await storage.updateFeeAssignment(assignment.id, { status: "overdue" });
    }
  }
  return overdue.length;
}

/** Scan for assignments due soon or overdue and send reminder emails, respecting the reminder interval. */
async function runReminderSweep(): Promise<{ markedOverdue: number; remindersSent: number; errors: number }> {
  const markedOverdue = await markOverdueAssignments();

  const candidates: FeeAssignment[] = await storage.getFeeAssignmentsDueForReminder(REMINDER_INTERVAL_DAYS);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

  let remindersSent = 0;
  let errors = 0;

  for (const assignment of candidates) {
    const fee = await storage.getFee(assignment.feeId);
    if (!fee) continue;
    const dueDate = new Date(fee.dueDate);
    const isOverdue = assignment.status === "overdue";
    const withinWindow = dueDate <= windowEnd;
    if (!isOverdue && !withinWindow) continue;

    const result = await sendReminderForAssignment(assignment.id);
    if (result.success) {
      remindersSent++;
    } else {
      errors++;
    }
  }

  console.log(`[fee-reminder-service] Sweep complete: ${markedOverdue} marked overdue, ${remindersSent} reminders sent, ${errors} errors`);
  return { markedOverdue, remindersSent, errors };
}

let intervalHandle: NodeJS.Timeout | null = null;

/** Start the background service. Runs once immediately, then on a fixed interval. */
export function startFeeReminderService(intervalMs = 6 * 60 * 60 * 1000): void {
  if (intervalHandle) return; // already running
  runReminderSweep().catch((err) => console.error("[fee-reminder-service] Initial sweep failed:", err));
  intervalHandle = setInterval(() => {
    runReminderSweep().catch((err) => console.error("[fee-reminder-service] Sweep failed:", err));
  }, intervalMs);
  console.log(`[fee-reminder-service] Started (interval: ${intervalMs}ms)`);
}

export function stopFeeReminderService(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/** Exposed for admin-triggered manual runs (e.g. a "check now" button). */
export async function runFeeReminderSweepNow() {
  return runReminderSweep();
}
