---
name: karpathy-review-loop
description: Implement and rework code with the authoritative Karpathy Guidelines and isolated Code Review assessments, pausing after every review to show all four scores and let the developer continue, challenge reviewer feedback, accept a passing result, or stop. Use for testable coding tasks that require a developer-controlled A-grade review gate, including as the scored review stage inside another delivery workflow.
---

# Karpathy Review Loop

Coordinate `$karpathy-guidelines` and `$code-review` without copying or reinterpreting either source skill. Add only sequencing, the four-score A-grade rule, and the developer decision gate.

## Load authoritative dependencies

Before planning or changing code:

1. Resolve `karpathy-guidelines` and `code-review` from the current available-skills catalog.
2. Read both `SKILL.md` files completely on every invocation.
3. Follow any references that either source skill requires and read them completely.
4. Treat those current files as authoritative. If either dependency cannot be read, stop instead of reconstructing it.
5. Do not edit either dependency unless the user separately requests that change.

## Preserve workflow ownership

- Let the user's request define scope and outcome.
- Let `karpathy-guidelines` govern assumptions, implementation, rework, scope, simplicity, and verification.
- Let `code-review` govern review behaviour, the exact JSON result, issues, and scoring.
- Let this skill govern sequencing, pass/fail evaluation, and the Developer Review Gate.
- When embedded in a parent workflow, keep that workflow's TDD cadence, approval gates, evidence rules, and completion rules authoritative. This skill must not bypass them.

## Choose the entry mode

Use **standalone mode** when this skill owns implementation from the start. Define evidence of success, implement the smallest sufficient change, and verify it under `karpathy-guidelines` before review.

Use **embedded review mode** when a parent workflow has already implemented and verified the change. Begin with the isolated review, then route any approved rework back through the parent workflow's applicable test and approval gates.

Do not apply the A-grade gate to a purely documentation or configuration diff with no testable logic. The authoritative rubric fixes that diff's `coverage_score` at 80, so it cannot pass the 90 threshold. Report the scored loop as not applicable and return control to the parent workflow's static validation and human review gate.

## Produce an isolated review

After implementation and verification:

1. Create a fresh Code Review assessment whose sole review instruction is the exact prompt required by `$code-review`.
2. Supply only the PR title, metadata, commit messages when available, and the complete task diff requested by that prompt.
3. Do not expose the reviewer to these loop instructions, the Karpathy Guidelines, target scores, prior scores, prior reviews, implementation commentary, verification commentary, or desired conclusions.
4. Preserve the returned JSON exactly. Do not rewrite issues or adjust scores.
5. Evaluate the A-grade rule only after the assessment is complete.

## Apply the A-grade rule

The assessment passes only when every condition is independently true:

- `score >= 90`
- `owasp_score >= 90`
- `coverage_score >= 90`
- `ai_slop_score >= 90`

Do not average the scores or let one dimension compensate for another.

## Developer Review Gate

Pause after every assessment, including a passing assessment. Present:

- the review round number;
- Quality (`score`), OWASP, Coverage, and AI Diligence scores, each marked PASS or FAIL against 90;
- the overall gate result;
- the review summary and every issue without changing their meaning; and
- verification already completed.

Ask the developer to choose one of these explicit outcomes:

1. **Continue the loop** - accept the supported findings as rework input.
2. **Challenge or correct reviewer feedback** - identify any comment that appears factually wrong, based on missing context, or unsupported by the diff.
3. **Accept and exit** - available only when all four scores pass.
4. **Stop for now** - leave the work unapproved and report the current state.

Do not start rework until the developer explicitly chooses to continue the loop. Batched or autonomous implementation permission never skips this gate.

## Continue after developer approval

When the developer chooses to continue:

1. Triage every supported finding and below-A dimension.
2. Reapply all current `karpathy-guidelines` instructions.
3. Route material scope, behaviour, data, security, architecture, or acceptance changes through the parent workflow's approval gate before editing.
4. For behavioural corrections, add or update a failing test before production code. For non-behavioural corrections, keep existing tests green and avoid manufactured tests.
5. Make the smallest supported correction, rerun relevant verification, and review the complete updated task diff in a fresh isolated assessment.
6. Return to the Developer Review Gate. Never continue automatically from one review round to another.

## Resolve challenged feedback

When the developer challenges a comment:

1. Preserve the original JSON as the immutable result of that round.
2. Check the claim against the complete diff, repository source, tests, and authoritative project rules.
3. If review material was incomplete or wrong, correct the material and run a fresh isolated assessment. Do not feed the prior review, challenge, desired score, or rebuttal to the reviewer.
4. If the implementation or intent is ambiguous, explain the evidence and ask whether to continue with a scoped correction. Use the parent workflow's gate when required.
5. If the original comment is supported, explain why and return to the same developer choices.
6. Never delete a valid finding, alter a returned score, or invent a replacement score to resolve disagreement. If the dispute cannot be resolved with evidence, stop with the current scores and exact decision needed.

## Finish or stop

Finish successfully only after the developer chooses **Accept and exit**, the requested outcome and verification criteria are satisfied, and all four current scores are at least 90.

When stopping before a pass, report the current scores, unresolved findings, completed verification, and what would be needed to continue. Do not claim successful completion.

For an implementation handoff, include the final four scores. When the user asked only for a review, obey `$code-review`'s exact JSON-only output contract; the calling workflow, not the reviewer, owns any separate gate presentation.
