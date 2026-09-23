export const EVENT_DURATION_OPTIONS = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 45, label: "45 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "1 hour 30 minutes" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
] as const;

export const DEFAULT_EVENT_DURATION_MINUTES = 120;

type DateValue = Date | string | number;

export function addEventDuration(startTime: DateValue, durationMinutes: number): Date {
  const start = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

export function getEventDurationMinutes(startTime: DateValue, endTime: DateValue): number | null {
  const start = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
  const end = endTime instanceof Date ? new Date(endTime.getTime()) : new Date(endTime);
  const difference = end.getTime() - start.getTime();

  if (!Number.isFinite(difference) || difference <= 0) return null;

  return difference / (60 * 1000);
}

export function getEventDurationPreset(startTime: DateValue, endTime: DateValue): number | null {
  const duration = getEventDurationMinutes(startTime, endTime);
  if (duration === null) return null;

  return EVENT_DURATION_OPTIONS.some((option) => option.minutes === duration) ? duration : null;
}
