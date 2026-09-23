import assert from "node:assert/strict";
import test from "node:test";
import { buildWelcomeEmail } from "./welcome-template.ts";

test("welcome email includes web and mobile entry points", () => {
  const email = buildWelcomeEmail("Alex", "https://teamhub.example");

  assert.equal(email.subject, "Welcome to TeamHub");
  assert.match(email.text, /Hi Alex,/);
  assert.match(email.text, /https:\/\/teamhub\.example\/dashboard/);
  assert.match(email.html, /teamhub:\/\//);
});

test("welcome email escapes names used in HTML", () => {
  const email = buildWelcomeEmail('<Alex & "Sam">', "https://teamhub.example");

  assert.doesNotMatch(email.html, /<Alex/);
  assert.match(email.html, /&lt;Alex &amp; &quot;Sam&quot;&gt;/);
});
