# Mobile dependency security review

Reviewed November 10, 2026 with `npm audit --omit=dev`.

## Applied compatible updates

- The two critical findings were `shell-quote` (through React Native's devtools tooling) and `tar` (through Expo CLI). Overrides now resolve to `1.12.0` and `7.5.22`.
- High findings in `node-forge`, Expo's `@xmldom/xmldom` dependency, and PostCSS were addressed with `node-forge@1.4.3`, a scoped `@expo/plist` override to `@xmldom/xmldom@0.8.15`, and `postcss@8.5.32`.
- A non-forced `npm audit fix` also updated compatible transitive packages in the lockfile.
- `npm audit --omit=dev` now reports zero critical and four high findings.

## Remaining high findings

- `expo-router@6.0.24`, `query-string@7.1.3`, and `decode-uri-component@0.2.2` are one related advisory chain. npm's proposed fix requires `expo-router@58.0.30`, a major jump from the SDK 54-compatible Router 6 line. Do not force this in isolation; address it with a coordinated Expo SDK upgrade and recheck the navigation flow.
- Metro 0.83.3 uses `image-size@1.2.1`, which has a high-severity advisory. The patched `image-size@2.0.3` override was tested, but it causes Expo's all-platform export to fail with a `TypeError` while processing assets. Keep Metro's compatible version until a Metro update supports the patched major, then retry the export.

The remaining findings are recorded as pending compatibility work, not accepted as resolved. Re-run the production audit after Expo or Metro updates.
