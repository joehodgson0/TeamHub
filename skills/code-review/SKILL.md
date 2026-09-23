---
name: code-review
description: Apply the user's exact Code Review SYSTEM_PROMPT to code, diffs, pull requests, and implementation work. Use whenever the user asks Codex to review implementation work and whenever Codex performs the review stage of a development loop. Do not use for non-code artifacts with no implementation content.
---

# Code Review

Read [references/system-prompt.md](references/system-prompt.md) completely on every invocation.

Use the contents of that file verbatim as the sole instruction for creating the review. Do not add, remove, paraphrase, reinterpret, supplement, or restate any review instruction, scoring rule, calibration rule, severity rule, review procedure, or output requirement.

Supply only the review material requested by that prompt: the PR title, metadata, commit messages when available, and the diff.

When the user requests a review, return the prompt's output exactly. When another skill invokes this skill as an internal review stage, give that skill the same exact JSON result without changing the review prompt.
