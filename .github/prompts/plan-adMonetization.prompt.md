# Plan: Mobile App Ad Monetization with Google AdMob

**TL;DR** — Integrate Google AdMob into the TeamHub Expo/React Native app using the `react-native-google-mobile-ads` library. The plan covers account setup, SDK integration, ad placement (banners + native ads), privacy compliance (ATT on iOS, GDPR consent), and the path to publishing on both stores. AdMob is recommended over Meta Audience Network because it has the highest fill rates, best React Native support, and doesn't require a Facebook business account. Starting with ads for all users is simplest; a paid ad-free tier can be layered on later.

**Steps**

## Phase 1 — Accounts & Prerequisites

1. **Create a Google AdMob account** at [admob.google.com](https://admob.google.com). You'll need a Google account and a payment-receiving method (bank account). Approval can take 1–2 days.
2. **Register two apps in AdMob** — one iOS (`com.joehodgson0.teamhub`), one Android (`com.joehodgson0.teamhub`). Since the apps aren't published yet, select "No" when asked if they're on the store — you can link them later.
3. **Create ad units** in the AdMob console:
   - **Banner ad unit** (iOS + Android) — for persistent bottom/top banners.
   - **Native Advanced ad unit** (iOS + Android) — for in-feed native ads on the Dashboard or Posts tab.
   - Note down all ad unit IDs (format: `ca-app-pub-XXXX/YYYY`).
4. **Apple Developer account** — required to publish to the App Store. Costs $99/year. You'll need one to add ATT permission and submit the app.
5. **Google Play Developer account** — $25 one-time fee. Required for Android publishing.

## Phase 2 — SDK Installation & Configuration

6. **Install `react-native-google-mobile-ads`** — add the dependency in `mobile/package.json`. This is the maintained community library (formerly `@react-native-firebase/admob`). It supports the New Architecture (Fabric) as of v16+.
7. **Configure the AdMob app IDs** in `mobile/app.json` — add the `react-native-google-mobile-ads` config plugin with your iOS and Android AdMob app IDs. This automatically wires `GADApplicationIdentifier` into Info.plist and `meta-data` into AndroidManifest.xml.
8. **Install `expo-tracking-transparency`** — required for iOS ATT (App Tracking Transparency) prompt. Add the `NSUserTrackingUsageDescription` string to `mobile/app.config.ts` via the plugin config. Apple **rejects apps** that use the IDFA without this.
9. **Install a UMP (User Messaging Platform) consent SDK** — Google requires GDPR consent for EU users. The `react-native-google-mobile-ads` library includes built-in UMP support via `AdsConsent` APIs.
10. **Run `npx expo prebuild --clean`** — regenerate the native `mobile/android/` and `mobile/ios/` directories with the new native modules linked.

## Phase 3 — Consent & Initialization Logic

11. **Create a consent/initialization module** at `mobile/src/lib/ads.ts` — this file will:
    - On app launch, request ATT permission (iOS only) via `expo-tracking-transparency`.
    - Then call `AdsConsent.requestInfoUpdate()` and `AdsConsent.showForm()` if required (GDPR regions).
    - Finally call `mobileAds().initialize()` to start the AdMob SDK.
12. **Wire initialization into the root layout** — call the ads init function early in `mobile/app/_layout.tsx`, after auth state is resolved but before rendering tabs. Only initialize for authenticated users (no ads on login/register screens).

## Phase 4 — Banner Ad Placement

13. **Create a `BannerAdComponent`** at `mobile/src/components/ads/BannerAd.tsx` — wraps the `BannerAd` component from `react-native-google-mobile-ads` with:
    - Adaptive banner sizing (fills width, auto-height).
    - Error handling (gracefully hides if ad fails to load).
    - Test ad unit IDs in development, real IDs in production.
14. **Place banner ads on key screens** — add the banner component to the bottom of these tab screens (above the tab bar, inside `SafeAreaView`):
    - **Dashboard** — `mobile/app/(tabs)/index.tsx`
    - **Posts** — `mobile/app/(tabs)/posts.tsx` (or equivalent)
    - **Events** — `mobile/app/(tabs)/events.tsx` (or equivalent)
    - Avoid placing banners on **Settings** (poor UX) and role-conditional tabs initially.

## Phase 5 — Native Ad Placement

15. **Create a `NativeAdCard` component** at `mobile/src/components/ads/NativeAdCard.tsx` — uses the `NativeAd` component (or `GADNativeAd` via the library's native ad support). Style it to match the existing `WidgetCard` component in `mobile/src/components/widgets/WidgetCard.tsx` so it blends into the dashboard.
16. **Insert native ads into the Dashboard widget list** — in the Dashboard screen, interleave a `NativeAdCard` between existing widgets (e.g., after the 2nd widget). This provides a non-intrusive, high-CPM ad placement.

## Phase 6 — Development Testing

17. **Use AdMob test ad unit IDs** during development — Google provides these (`ca-app-pub-3940256099942544/...`). **Never use real ad unit IDs during development**, as clicking test ads with real IDs can get your account banned.
18. **Add test device IDs** — register your physical test devices in the AdMob console and in the app's `RequestConfiguration` so you always see test ads during development.
19. **Build a development client** via EAS: `eas build --profile development --platform all` from the `mobile/` directory. Ads require native code — they won't work in Expo Go.

## Phase 7 — App Store Preparation & Privacy

20. **Update App Store privacy declarations** — in App Store Connect, declare that the app collects data for advertising (Device ID, Usage Data) under the "Data Used to Track You" section. This is required for AdMob.
21. **Update Google Play data safety form** — declare ad-related data collection in the Play Console's Data Safety section.
22. **Add an `app-ads.txt` file** — host this at your domain (if you have a website) to verify ad inventory ownership. Optional but recommended.
23. **Update the app's privacy policy** — disclose that the app uses Google AdMob for advertising and that ad-related data (IDFA/GAID) may be collected.

## Phase 8 — Production Build & Launch

24. **Switch to production ad unit IDs** — update the ad configuration to use real ad unit IDs (from step 3) when building for production.
25. **Build production binaries**: `eas build --profile production --platform all` using the existing production profile in `mobile/eas.json`.
26. **Submit to stores** — use `eas submit` or upload manually. Expect a review period of 1–3 days (Apple) and a few hours (Google).
27. **Monitor AdMob dashboard** — after launch, track impressions, fill rate, eCPM, and revenue. Optimize placements based on data.

---

## Verification

- In development builds, confirm test banner ads render on Dashboard, Posts, and Events tabs.
- Confirm ATT dialog appears on iOS before ads load.
- Confirm GDPR consent form appears for EU-region test devices.
- Confirm native ad cards match the visual style of `WidgetCard`.
- Confirm ads do NOT appear on auth screens (landing, login, register).
- After store publishing, verify real ads serve and revenue appears in the AdMob console (may take 24–48 hours).

## Decisions

- **AdMob over Meta Audience Network**: higher fill rates, no Facebook account dependency, best RN support, built-in UMP/GDPR consent tools.
- **Banner + Native over Interstitial**: interstitials are disruptive for a team management app — banners and native ads are less intrusive and better for retention.
- **Ads on all users initially**: simplest path to revenue. A premium ad-free tier (via in-app purchases with `expo-iap` or RevenueCat) can be added later once you have revenue data to justify the effort.
- **Native ads on the widget-based Dashboard**: high visibility, blends naturally with the card-based layout already in use.
