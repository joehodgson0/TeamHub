export type EventParticipationPhase = "upcoming" | "in_progress" | "completed";

type DateInput = Date | string | number;

export function getEventParticipationPhase(
  startTime: DateInput,
  endTime: DateInput,
  now: DateInput = new Date(),
): EventParticipationPhase {
  const currentTime = new Date(now).getTime();
  if (currentTime < new Date(startTime).getTime()) return "upcoming";
  if (currentTime < new Date(endTime).getTime()) return "in_progress";
  return "completed";
}
