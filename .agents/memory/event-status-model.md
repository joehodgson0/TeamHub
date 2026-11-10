---
name: Event status, attendance, and match outcomes
description: Rules for availability, verified attendance, and no-score match outcomes.
---

Planned availability and actual attendance must remain separate event records. Parents and team coaches can set availability only before an event starts. Only a coach for that team can verify attended or absent status once the event has started.

**Why:** A parent's intention before an event is not proof that the player attended. Keeping both records allows coaches to compare expected and actual turnout without overwriting the original response.

**How to apply:** Any event UI, reporting, statistics, or exports should label availability as planned and attendance as verified. Do not infer actual attendance from an available response.
Forfeits are status-only: they do not add a score or affect team statistics, and the record identifies which side forfeited. Cancelled matches are also no-score outcomes.

**Why:** The product owner explicitly chose status-only handling for forfeits so a forfeiture is not treated as a played result.

**How to apply:** Do not create a match-result score row or count cancelled/forfeited fixtures in team statistics; preserve the forfeiting side in the outcome status.
