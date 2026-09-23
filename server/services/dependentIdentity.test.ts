import assert from "node:assert/strict";
import test from "node:test";
import { dependentDateKey, isSameDependentIdentity, normalizeDependentName } from "./dependentIdentity.ts";

test("normalizes spacing and case in dependant names", () => {
  assert.equal(normalizeDependentName("  Alex   Smith "), "alex smith");
});

test("compares dates by calendar key", () => {
  assert.equal(dependentDateKey("2015-06-09T15:30:00.000Z"), "2015-06-09");
});

test("identifies the same dependant within one team", () => {
  assert.equal(isSameDependentIdentity(
    { name: "Alex Smith", dateOfBirth: "2015-06-09", teamId: "team-a" },
    { name: " alex  SMITH ", dateOfBirth: new Date("2015-06-09T00:00:00.000Z"), teamId: "team-a" },
  ), true);
});

test("does not treat players on different teams as duplicates", () => {
  assert.equal(isSameDependentIdentity(
    { name: "Alex Smith", dateOfBirth: "2015-06-09", teamId: "team-a" },
    { name: "Alex Smith", dateOfBirth: "2015-06-09", teamId: "team-b" },
  ), false);
});
