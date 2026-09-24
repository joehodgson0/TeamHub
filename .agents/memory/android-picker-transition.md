---
name: Android date/time picker transition
description: Why sequential native date and time dialogs require extra care in this mobile app
---

For Android's modal date/time picker, changing the mode from date to time on an already-mounted picker can show the date dialog twice. Remount the picker for the second step and wait for Android's native date dialog to dismiss before opening time.

**Why:** The installed modal picker memoizes based on visibility and selected date, not mode; Android also calls its hide callback synchronously during confirmation, before its dialog has fully finished closing.

**How to apply:** When creating another sequential date/time flow, keep selected date and time separate from dialog visibility, hide first on confirmation, then open a fresh time picker after native dismissal. Do not force an iOS remount during its close animation.