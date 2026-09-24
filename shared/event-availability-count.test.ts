import assert from "node:assert/strict";
import { test } from "node:test";
import { getRosterAvailabilityCount } from "./event-availability-count.ts";

test("counts only current roster IDs, not stale availability or team IDs", () => {
  assert.deepEqual(
    getRosterAvailabilityCount(
      [{ id: "one" }, { id: "two" }, { id: "three" }],
      { one: "available", two: "available", removed: "available" },
    ),
    { confirmed: 2, total: 3 },
  );
});

test("counts each player once even when a roster repeats an ID", () => {
  assert.deepEqual(
    getRosterAvailabilityCount([{ id: "one" }, { id: "one" }, { id: "two" }], { one: "available" }),
    { confirmed: 1, total: 2 },
  );
});