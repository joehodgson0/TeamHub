---
name: Post-merge database safety
description: Scope and safety requirements for automatic setup after task merges.
---

The automatic post-merge setup may install locked dependencies and build the app, but should not run database-writing commands such as `drizzle-kit push` by default.

**Why:** The hook runs without a person reviewing its target environment, and database credentials may point to shared or production data.

**How to apply:** Only add migrations to the hook after there is a verified, environment-specific migration path that cannot unintentionally write to production.
