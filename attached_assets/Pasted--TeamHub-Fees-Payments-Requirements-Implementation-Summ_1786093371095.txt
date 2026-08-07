# TeamHub Fees & Payments — Requirements & Implementation Summary

_Date: 2026-08-07_

## 1. Requirements (as given)

- The fees/payments functionality is only fully visible to users with the **admin** role.
  - On web and mobile, the Fees/Payments pages show **"Coming soon!"** to non-admins.
  - Admins can see and test the full functionality.
- Role-based views for admins depending on their other roles:
  - **Admin + parent**: parent view — see status (up to date / next payment due / overdue) with a link to pay.
  - **Admin + coach** (or admin, coach): coach view — see who on the team is up to date and who isn't.
  - **Admin + coach + parent**: both coach and parent views.
  - **Admin only**: admin view — set up fee schedules and see up-to-date status of teams/individuals.
- **Season fee schedule**, set up by admins, stored per club per season (e.g. "2026/27", "2027/28"):
  - Fee for a parent who is also a coach (default **£60**).
  - Fee for a parent of a player on a team **without** mid-week training (default **£250**).
  - Fee for a parent of a player on a team **with** mid-week training (default **£350**).
  - Teams gain a **mid-week training** boolean flag, settable/updatable by coaches when managing a team.
- Each season, parents choose one of **2 payment options**:
  - **Pay in full** at the start of the season — **10% discount**.
  - **Monthly installments**, September through May, with the **first September payment doubled** so there are 10 "payment units" spread across 9 transactions.
- A **background service** tracks each player's fee schedule and **emails parents** when an installment payment is due.
- Admins can see payment status at any time and can **manually send chaser emails** to parents.

## 2. Design approach

Rather than introducing a brand-new payment-tracking model, the existing `fees` / `feeAssignments` / `payments` tables (which already had a working Stripe checkout + webhook flow) were reused and extended:

- A **fee schedule** (`feeSchedules`) holds the season's default rates and the discount/installment settings.
- A **fee enrollment** (`feeEnrollments`) records the plan a specific player is on for a season (fee type + payment option + total amount).
- Enrolling generates one or more `fees` + `feeAssignments` (one per installment, or a single discounted one for "pay in full"), so the existing Stripe checkout, webhook, outstanding-fees, and payment-history code paths work unchanged.
- `feeAssignments` gained `season`, `enrollmentId`, `installmentNumber`, `lastReminderSentAt`, `reminderCount` columns to support status views and the reminder service.

## 3. Backend changes

| File | Change |
|---|---|
| `shared/schema.ts` | Added `midWeekTraining` to `teams`; new `feeSchedules` and `feeEnrollments` tables + Zod schemas/types; extended `feeAssignments` with season/installment/reminder tracking columns. |
| `server/storage.ts` | CRUD methods for fee schedules and enrollments; queries to find assignments due for a reminder and overdue assignments. |
| `server/services/feeCalculator.ts` | Pure logic: determines fee type (coach / midweek / no-midweek), computes "pay in full" (discounted, single payment) and "installments" (10 units over 9 monthly transactions, Sept doubled) plans. |
| `server/services/feeReminderService.ts` | Background job (runs on startup, then every 6 hours): marks overdue assignments, emails reminders (respecting a 7-day resend interval and a 7-day "due soon" window). Exposes `sendReminderForAssignment` (used by the manual admin "chaser" endpoint) and `runFeeReminderSweepNow` (admin-triggered manual run). |
| `server/email/` | New provider-agnostic email abstraction (mirrors the existing payment-provider pattern): `console-provider.ts` (default, logs emails — always available), `resend-provider.ts` (real email via the Resend HTTP API using `fetch`, no new npm dependency, used only if `RESEND_API_KEY` is set), `index.ts` factory. |
| `server/routes.ts` | New endpoints (all role/club checked): `GET/POST /api/fee-schedules`, `GET /api/fee-schedules/:season/overview`, `PATCH /api/teams/:teamId/mid-week-training`, `POST /api/fees/enroll`, `GET /api/fees/my-status`, `GET /api/fees/my-enrollments`, `GET /api/fees/team-status/:teamId`, `POST /api/fees/assignments/:id/remind`, `POST /api/fees/reminders/run-now`. |
| `server/index.ts` | Starts the fee reminder background service after routes are registered. |

Database schema changes were applied to the local Postgres instance with `drizzle-kit push`.

## 4. Web (client) changes

| File | Change |
|---|---|
| `client/src/pages/fees.tsx` | Non-admins see the `ComingSoon` component. Admins see tabs: **Season Fee Schedules** and **Team & Player Status** (always), plus **Manage Fees** and **My Team Status** if they also have the coach role. |
| `client/src/pages/payments.tsx` | Non-admins see `ComingSoon`. Admins without the parent role see a short explanatory message. Admin+parent see season enrollment prompts, fee status, outstanding fees, and payment history. |
| `client/src/components/fees/fee-schedule-manager.tsx` | Admin UI to set/update a season's default fees, discount %, and installment count. |
| `client/src/components/fees/season-overview.tsx` | Admin UI: per-player up-to-date/overdue status for a season, plus a "check overdue & send reminders" button (manual reminder sweep). |
| `client/src/components/fees/team-fee-status.tsx` | Coach UI: per-team player payment status. |
| `client/src/components/payments/fee-status-widget.tsx` | Parent UI: each child's up-to-date/due/overdue status with a "Make Payment" button. |
| `client/src/components/payments/season-enrollment.tsx` | Parent UI: choose "pay in full" vs "installments" for any child not yet enrolled in the current season. |
| `client/src/components/ui/coming-soon.tsx` | Shared "Coming soon!" placeholder shown to non-admins. |
| `client/src/components/team/team-management-section.tsx` | Coaches get a mid-week training toggle switch on each team card. |
| `client/src/components/layout/sidebar.tsx` | Fees/Payments nav links now visible to all roles (page itself decides Coming Soon vs full content). |
| `client/src/lib/season.ts` | Helpers for computing/formatting season strings (e.g. "2026/27"). |

## 5. Mobile changes

| File | Change |
|---|---|
| `mobile/src/context/UserContext.tsx` | Added `admin` to the role union and an `isAdmin` flag. |
| `mobile/app/(tabs)/fees.tsx` | New Fees tab: "Coming soon!" for non-admins; admins see a season schedule summary, parent fee status (if parent), and coach team status (if coach). |
| `mobile/app/(tabs)/_layout.tsx` | Registered the new Fees tab. |

## 6. Incidental fixes

- `package.json` `devwin` script had a pre-existing bug: `SET VAR=value && ...` (space before `&&`) caused `cmd.exe` to include the trailing space in the value, corrupting `DATABASE_URL` (`teamhub ` instead of `teamhub`) and breaking all DB access when running via `npm run devwin`. Fixed by removing the space before each `&&`.
- Noted but **not** fixed: `tsconfig.json` has a pre-existing typo (`"module": "esnNext"`) that breaks the `npm run check` CLI command. Correcting it to a valid NodeNext config cascades into unrelated import-extension errors across the whole repo, so it was left as-is; changes in this feature were verified via the editor's language service instead (no errors reported).

## 7. Verification performed

- `drizzle-kit push` applied cleanly with no pending diffs.
- Dev server boots successfully; the reminder background service runs its initial sweep without error.
- Spot-checked a new endpoint (`GET /api/fee-schedules`) returns the expected `401 Unauthorized` when not logged in.
- No errors reported by the editor's TypeScript language service across all new/changed files.

## 8. Known follow-ups (not implemented)

- Mobile doesn't yet open an in-app browser/checkout for Stripe payment — it currently just logs the checkout URL.
- No admin UI yet to edit/cancel an existing enrollment once created.
- CSV export doesn't yet include season/installment columns.
- No automated tests were added for the new logic.
