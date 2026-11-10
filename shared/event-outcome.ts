import type { EventResult } from "./schema";

export type UnplayedMatchOutcome = Extract<EventResult, { status: "cancelled" | "forfeit" }>;

export function isUnplayedMatchOutcome(
  result: EventResult | null | undefined,
): result is UnplayedMatchOutcome {
  return !!result && "status" in result;
}

export function getUnplayedMatchOutcomeLabel(
  result: UnplayedMatchOutcome,
  teamLabel = "Your team",
  opponentLabel = "Opponent",
): string {
  if (result.status === "cancelled") return "Cancelled";
  return result.forfeitedSide === "team"
    ? `Forfeit — ${teamLabel} forfeited`
    : `Forfeit — ${opponentLabel} forfeited`;
}
