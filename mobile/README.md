# TeamHub Mobile App

React Native mobile application for TeamHub using Expo and Expo Router.

## Prerequisites

- Node.js 18+ installed
- iOS Simulator (for macOS users) or Android Studio (for Android development)
- Expo Go app on your physical device (optional, for testing on real devices)

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API URL:**
   
   Update the `API_BASE_URL` in `src/lib/config.ts` to point to your backend:
   - Development: Your Replit backend URL (e.g., `https://your-repl-name.repl.co`)
   - Production: Your deployed backend URL

3. **Start the development server:**
   ```bash
   npm start
   ```

   This will open the Expo developer tools in your terminal.

## Running the App

### On iOS Simulator (macOS only)
```bash
npm run ios
```

### On Android Emulator
```bash
npm run android
```

### On Physical Device
1. Install the Expo Go app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. The app will load on your device

## Project Structure

```
mobile/
├── app/                      # Expo Router file-based routing
│   ├── (auth)/              # Authentication screens
│   │   ├── landing.tsx      # Landing page
│   │   ├── login.tsx        # Login screen
│   │   ├── register.tsx     # Registration screen
│   │   └── role-selection.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── dashboard.tsx
│   │   ├── teams.tsx
│   │   ├── events.tsx
│   │   ├── posts.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configuration
│   └── types/              # TypeScript types
├── assets/                  # Images and static assets
├── app.json                # Expo configuration
├── package.json
└── tsconfig.json

```

## Features Implemented (Phase 1)

- ✅ Expo Router file-based navigation
- ✅ NativeWind (Tailwind CSS for React Native)
- ✅ Authentication screens (Login, Register, Role Selection)
- ✅ Bottom tab navigation for authenticated users
- ✅ React Query integration for API calls
- ✅ Shared types with backend via @shared alias
- ✅ Theme matching web application

## Next Steps (Future Phases)

Phase 2-9 will implement:
- Team management screens
- Event scheduling and management
- Player/dependent management
- Availability tracking
- Match results
- Posts and announcements
- Player statistics and awards
- Kit management
- Push notifications
- Offline support

## Development Notes

- The mobile app uses the same Express backend as the web application
- API calls are made to the backend URL configured in `src/lib/config.ts`
- Sessions are managed via cookies (credentials: "include" in fetch)
- NativeWind provides Tailwind-like styling for React Native components

## Building for Production

### iOS
1. Create an Apple Developer account ($99/year)
2. Configure app signing in Xcode
3. Run: `npx expo build:ios`
4. Submit to App Store via App Store Connect

### Android
1. Create a Google Play Developer account ($25 one-time)
2. Generate signing keys
3. Run: `npx expo build:android`
4. Submit to Google Play Console

## Troubleshooting

**Cannot connect to backend:**
- Ensure the API_BASE_URL in `src/lib/config.ts` is correct
- Check that your backend is running and accessible
- Verify CORS settings allow requests from mobile app

**Styling issues:**
- Make sure NativeWind is properly configured in `metro.config.js`
- Run `npm start --clear` to clear Metro bundler cache

**Module resolution errors:**
- Check that babel-plugin-module-resolver is installed
- Verify path aliases in `babel.config.js` and `tsconfig.json`
