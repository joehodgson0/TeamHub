---
name: Live database targeting
description: Avoid mistaking the legacy Neon database for the live app database.
---

Do not assume the available NEON_DATABASE_URL points to the live app's database. As checked on 2026-10-13, it contained older club data, while Replit's managed production query matched the live app.

**Why:** The older database shares club IDs with production, so matching IDs alone misleadingly suggests it is the same live database. Comparing the full club record exposed the mismatch.

**How to apply:** Before any production data change, confirm the current target using production database queries and the live API. Recheck because the deployment may change. Managed production SQL access is read-only; use the authenticated admin workflow for creation rather than writing to the legacy copy.
