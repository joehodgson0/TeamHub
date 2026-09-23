import assert from "node:assert/strict";
import test from "node:test";
import {
  addEventDuration,
  buildWeeklyEventTimes,
  getEventDurationPreset,
  MAX_EVENT_REPEAT_WEEKS,
} from "./event-duration.ts";

test("duration presets calculate and round-trip an end time", () => {
  const startTime = new Date("2026-09-23T18:00:00.000Z");
  const endTime = addEventDuration(startTime, 90);

  assert.equal(endTime.toISOString(), "2026-09-23T19:30:00.000Z");
  assert.equal(getEventDurationPreset(startTime, endTime), 90);
});

test("weekly recurrence creates the requested number of weekly occurrences", () => {
  const occurrences = buildWeeklyEventTimes(
    "2026-09-23T18:00:00.000Z",
    "2026-09-23T19:30:00.000Z",
    MAX_EVENT_REPEAT_WEEKS,
  );

  assert.equal(occurrences.length, 10);
  assert.equal(occurrences[0].startTime.toISOString(), "2026-09-23T18:00:00.000Z");
  assert.equal(occurrences[9].startTime.toISOString(), "2026-11-25T18:00:00.000Z");
  assert.equal(occurrences[9].endTime.getTime() - occurrences[9].startTime.getTime(), 90 * 60 * 1000);
});

test("weekly recurrence rejects invalid occurrence counts and date ranges", () => {
  const startTime = new Date("2026-09-23T18:00:00.000Z");
  const endTime = new Date("2026-09-23T19:30:00.000Z");

  assert.throws(() => buildWeeklyEventTimes(startTime, endTime, 0), RangeError);
  assert.throws(() => buildWeeklyEventTimes(startTime, endTime, 11), RangeError);
  assert.throws(() => buildWeeklyEventTimes(endTime, startTime, 2), RangeError);
});
