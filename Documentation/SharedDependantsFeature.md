# Shared dependant records

TeamHub stores one player record per child and team. More than one registered
parent/guardian can be linked to that record through `player_guardians`.

## Parent workflow

1. The first parent registers the dependant normally with the team code.
2. The second parent creates a TeamHub account and selects the Parent role.
3. The first parent opens **Dependants**, selects **Parents**, and links the second
   parent's registered email address.
4. The same dependant then appears in both parents' web and mobile accounts. Both
   parents can use the existing availability and fee flows without creating another
   player in the team.

Creating a dependant with the same normalized name, date of birth, and team now returns
HTTP 409 with code `DUPLICATE_DEPENDANT`. The user is directed to an existing guardian
or the team coach instead of creating another player.

## Coach correction workflow

On web or mobile, a coach can open **Manage parents** from a player in one of their team
rosters. The coach can:

- link a registered parent by email; or
- merge records when name, date of birth, and team are identical.

The merge keeps the selected record, combines its guardian links, moves availability,
attendance, and match-stat references, removes the duplicate roster ID, and deletes the
duplicate player in one transaction. A duplicate with fee assignments or fee enrolments
is rejected and must be reviewed by a club administrator so financial history is never
silently reassigned.

## Deployment

Apply `migrations/0001_add_player_guardians.sql` before deploying the application code.
The migration creates the link table and backfills every existing player's primary
parent. It is idempotent and can be applied more than once safely.

For environments managed directly by Drizzle, review the target database and then use:

```sh
npm run db:push
```

Do not run schema changes against a shared or production database without the normal
backup, review, and deployment approval process.
