---
name: EAS build registry portability
description: Keep Replit-internal npm proxy URLs from breaking remote EAS dependency installs.
---

Replit may write `package-lock.json` tarball URLs using its internal package firewall host. EAS Build workers cannot reach that host. Normalize the exact internal URL prefix to the public npm registry in an EAS-only pre-install hook, preserving lockfile versions and integrity hashes; leave the local lockfile and registry configuration unchanged.

**Why:** Remote `npm ci` failed with npm's generic exit-handler error, and mapping only the host preserved the proxy's `/npm/` path, producing 404s.

**How to apply:** Before diagnosing missing packages in a remote EAS build, inspect lockfile `resolved` hosts. Use `eas-build-pre-install` to rewrite internal URLs only in EAS's temporary build copy, then verify the hook log and dependency-install phase.
