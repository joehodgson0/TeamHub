export const EVENT_DURATION_OPTIONS = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 45, label: "45 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "1 hour 30 minutes" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
] as const;

export const DEFAULT_EVENT_DURATION_MINUTES = 120;
export const MAX_EVENT_REPEAT_WEEKS = 10;
export const EVENT_MEET_BEFORE_OPTIONS = [
  { minutes: 0, label: "No early meet" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 45, label: "45 minutes before" },
  { minutes: 60, label: "1 hour before" },
] as const;

type DateValue = Date | string | number;

export function addEventDuration(startTime: DateValue, durationMinutes: number): Date {
  const start = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

export function getEventMeetTime(startTime: DateValue, meetBeforeMinutes: number): Date {
  const start = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
  return new Date(start.getTime() - meetBeforeMinutes * 60 * 1000);
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

export function buildWeeklyEventTimes(startTime: DateValue, endTime: DateValue, weeks: number) {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_EVENT_REPEAT_WEEKS) {
    throw new RangeError(`Weekly events must contain between 1 and ${MAX_EVENT_REPEAT_WEEKS} occurrences`);
  }

  const start = startTime instanceof Date ? new Date(startTime.getTime()) : new Date(startTime);
  const end = endTime instanceof Date ? new Date(endTime.getTime()) : new Date(endTime);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new RangeError("End time must be after start time");
  }

  const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: weeks }, (_, weekIndex) => ({
    startTime: new Date(start.getTime() + weekIndex * weekInMilliseconds),
    endTime: new Date(end.getTime() + weekIndex * weekInMilliseconds),
  }));
}
