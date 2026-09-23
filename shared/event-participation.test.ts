import assert from "node:assert/strict";
import test from "node:test";
import { getEventParticipationPhase } from "./event-participation.ts";

const start = "2026-09-23T18:00:00.000Z";
const end = "2026-09-23T19:30:00.000Z";

test("an event is upcoming before its start time", () => {
  assert.equal(getEventParticipationPhase(start, end, "2026-09-23T17:59:59.999Z"), "upcoming");
});

test("an event is in progress from its start until its end", () => {
  assert.equal(getEventParticipationPhase(start, end, start), "in_progress");
  assert.equal(getEventParticipationPhase(start, end, "2026-09-23T19:29:59.999Z"), "in_progress");
});

test("an event is completed at its end time", () => {
  assert.equal(getEventParticipationPhase(start, end, end), "completed");
});
