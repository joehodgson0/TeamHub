# TeamHub contributor guide

## Product context

TeamHub manages youth football clubs. Coaches and club administrators manage teams,
events, attendance, posts, fees, and results. Parents manage dependants, availability,
and payments. The system stores personal and medical information about children, so
privacy, authorization, and data minimization are core requirements.

## Repository layout

- `client/`: React 18 and Vite web application. It uses Wouter, TanStack Query,
  Tailwind CSS, and Radix/shadcn components.
- `mobile/`: Expo/React Native application using Expo Router and TanStack Query.
- `server/`: Express API, authentication, services, email, and payment providers.
- `shared/schema.ts`: shared Zod contracts, TypeScript types, and Drizzle tables.
- `Documentation/`: product requirements and feature documentation.
- `attached_assets/`: reference material supplied during development; do not treat it
  as runtime application code.

Keep web and mobile behavior aligned when changing shared product functionality.
Platform-specific presentation may differ, but permissions and business rules must not.

## Development commands

Install root and mobile dependencies separately:

```sh
npm ci
npm --prefix mobile ci
```

Common checks and workflows:

```sh
npm run check
npm run build
npm run devwin
npm --prefix mobile run lint
npm --prefix mobile test -- --runInBand
npm --prefix mobile start
```

On non-Windows systems, use `npm run dev` for the API and web development server.
Database schema changes are applied with `npm run db:push`; do not run this against a
shared or production database without explicit approval.

If dependencies are unavailable, report which checks could not run. Do not claim that
the project builds merely from static inspection.

## Configuration and secrets

- Never commit credentials, passwords, API keys, payment secrets, database URLs,
  session secrets, service-account files, or production tokens.
- Treat `.env*`, IDE launch configuration, documentation, logs, and attached assets as
  possible secret-bearing files.
- Use environment variables and checked-in example files containing placeholders only.
- Never print secret values in command output, logs, tests, or review comments.
- Mobile configuration must not contain server-side secrets. Expo `extra` values are
  part of the client application and should be considered public.

## Authentication and authorization

The backend currently supports traditional email/password sessions and Replit OIDC.
New server code must obtain the authenticated user through a single server-controlled
helper or middleware that supports both session types.

For every API route:

1. Authenticate the request unless the endpoint is deliberately public.
2. Load the acting user on the server; never trust a user ID, parent ID, club ID, role,
   author ID, fee amount, or ownership claim supplied by the client.
3. Authorize the exact resource and action. A role alone is insufficient: verify club,
   team, parent/dependant, or author ownership as applicable.
4. Validate params, query values, and request bodies with Zod before using them.
5. Return only fields needed by the caller. Child medical details, addresses, dates of
   birth, and emergency contacts require especially narrow access.

Client-side route guards and hidden buttons are user experience features, not security
controls. Enforce every rule on the server.

Users may choose the ordinary `coach` and `parent` roles during onboarding. Never allow
a user to grant themselves `admin`; privileged role assignment requires a separate,
server-authorized flow.

## Domain rules

- Coaches may manage only teams explicitly assigned to them.
- Parents may manage only their own dependants and may view only teams and events
  relevant to those dependants.
- Administrators must be scoped to their club unless an explicit system-wide role is
  introduced.
- A dependant and their team must belong to the same club as the parent association.
- Availability is editable only by the dependant's parent or that team's coach before
  the event begins.
- Attendance and match results are managed only by an authorized coach for that team.
- Post updates and deletion require author or explicitly defined club-admin authority.
- Store monetary values as integer minor units (pence), never floating-point pounds.
- Payment state changes must come from a verified, idempotent provider webhook or an
  explicitly authorized administrative workflow. Mock-payment routes must never be
  enabled in production.

## Data and database changes

- Define shared contracts in `shared/schema.ts`; avoid duplicating incompatible web,
  mobile, and server models.
- Prefer normalized relationships and database foreign keys over duplicated ID arrays.
- Add uniqueness and check constraints for invariants that must survive concurrent
  requests.
- Use database transactions for multi-step writes such as enrolment creation, fee and
  assignment generation, payment settlement, refunds, and account deletion.
- Design webhook handling and retryable jobs to be idempotent.
- Do not silently delete financial records. Preserve an auditable status/history where
  required.
- Schema changes must include a migration or a clearly documented deployment step.

## API and server conventions

- Keep `/api` endpoints thin: validation and HTTP translation belong in routers;
  business logic belongs in focused services; database access belongs in storage or
  repository modules.
- Split new route groups by domain rather than expanding `server/routes.ts` further.
- Use consistent JSON errors without exposing stack traces, provider internals, account
  existence, or sensitive record data.
- Do not log complete request or response bodies. Log stable identifiers and operational
  context, with personal data redacted.
- Apply rate limiting to login, registration, password reset, invitation/code lookup,
  email, and other abuse-sensitive endpoints.
- Preserve raw request bodies for signed payment webhooks and verify signatures before
  processing events.

## Web and mobile conventions

- Use TanStack Query for server state and invalidate the smallest relevant query set
  after mutations.
- Clear all user-specific caches on logout and account changes.
- Include session credentials on authenticated requests. Keep CSRF protection enabled
  for browser mutations; mobile exemptions must use an intentional, verifiable design.
- Reuse types from `shared/schema.ts` where the platform toolchain permits it. Avoid
  introducing new `any` types for domain records.
- Keep screen components focused. Extract large forms, lists, and business calculations
  into typed components, hooks, or utilities.
- Maintain accessible labels, keyboard navigation on web, and appropriate safe-area and
  keyboard behavior on mobile.

## Testing expectations

Changes should be covered at the lowest useful level, with special emphasis on server
authorization and financial behavior.

At minimum, test:

- unauthenticated requests are rejected;
- cross-user, cross-team, and cross-club access is rejected;
- ordinary users cannot acquire administrator privileges;
- child private fields are not returned to unauthorized callers;
- duplicate payment webhooks do not credit twice;
- refunds and partial payments produce consistent balances;
- logout clears web and mobile caches;
- shared user journeys behave consistently on web and mobile.

Before handing off a change, run the relevant type check, lint, tests, and production
build. Report the exact commands and results, including anything skipped.

## Change discipline

- Read the relevant product document and nearby implementation before editing.
- Preserve unrelated work in a dirty worktree.
- Keep changes scoped; avoid opportunistic large rewrites.
- Do not weaken authentication, validation, privacy, or payment checks to make a client
  flow pass.
- When fixing a security issue, search for the same pattern across every route and both
  clients.
- Update documentation when commands, environment variables, permissions, or user-visible
  behavior change.
