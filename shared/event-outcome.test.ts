import assert from "node:assert/strict";
import { test } from "node:test";
import { getUnplayedMatchOutcomeLabel, isUnplayedMatchOutcome } from "./event-outcome.ts";

test("only cancelled and forfeited outcomes count as unplayed match outcomes", () => {
  assert.equal(isUnplayedMatchOutcome({ status: "cancelled" }), true);
  assert.equal(isUnplayedMatchOutcome({ status: "forfeit", forfeitedSide: "opponent" }), true);
  assert.equal(isUnplayedMatchOutcome({ homeScore: 2, awayScore: 1, outcome: "W" }), false);
  assert.equal(isUnplayedMatchOutcome(null), false);
});

test("labels identify which side forfeited without implying a score", () => {
  assert.equal(getUnplayedMatchOutcomeLabel({ status: "cancelled" }), "Cancelled");
  assert.equal(
    getUnplayedMatchOutcomeLabel({ status: "forfeit", forfeitedSide: "team" }, "Green FC"),
    "Forfeit — Green FC forfeited",
  );
  assert.equal(
    getUnplayedMatchOutcomeLabel({ status: "forfeit", forfeitedSide: "opponent" }, "Green FC", "Blue FC"),
    "Forfeit — Blue FC forfeited",
  );
});
