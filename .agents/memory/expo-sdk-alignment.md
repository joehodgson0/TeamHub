---
name: Expo SDK alignment
description: Keep mobile Expo packages compatible and handle CLI changes to dynamic app config.
---

When Expo reports SDK package mismatches, align dependencies with Expo's compatible versions and rerun the install check and platform export. If the installer exits because it cannot write a requested plugin to the TypeScript dynamic config, the package changes may already have completed; apply the config change manually and verify the resolved config.

If local Expo commands accept `app.config.ts` but EAS Build's remote `READ_APP_CONFIG` phase fails parsing it, convert the dynamic config to plain JavaScript and retry the cloud build.

**Why:** Expo's installer can update packages before failing to edit dynamic config, and EAS Build's early remote config reader may reject TypeScript syntax even when local exports succeed.

**How to apply:** After dependency alignment, inspect the complete output and sync requested plugin changes in dynamic and static config. Verify `expo config` and platform exports; if the remote build still fails while reading a TS config, use a JS dynamic config and rerun EAS Build.
