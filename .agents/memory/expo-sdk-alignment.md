---
name: Expo SDK alignment
description: Keep mobile Expo packages compatible and handle CLI changes to dynamic app config.
---

When Expo reports SDK package mismatches, align dependencies with Expo's compatible versions and rerun the install check and platform export. If the installer exits because it cannot write a requested plugin to the TypeScript dynamic config, the package changes may already have completed; apply the config change manually and verify the resolved config.

**Why:** Expo's installer updated mobile dependencies, then exited with an error because it could not modify the dynamic app config automatically.

**How to apply:** After using Expo's dependency alignment command, inspect its complete output, sync any requested plugin changes in the dynamic config (and its static mirror if present), then rerun the compatibility check and export.
