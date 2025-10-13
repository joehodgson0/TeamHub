# TeamHub Mobile App

React Native mobile application for TeamHub using Expo SDK 54.

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Test on Device:**
   - Open **Expo Go** app on your iPhone or Android device
   - Scan the QR code shown in the terminal
   - The app will load on your device

## Tech Stack

- **Expo SDK 54** (React Native 0.81, React 19.1)
- **Expo Router** - File-based navigation
- **React Query** - Server state management
- **TypeScript** - Type safety

## Project Structure

```
mobile/
├── app/              # Expo Router screens
│   ├── _layout.tsx   # Root layout
│   └── index.tsx     # Home screen
├── src/
│   ├── lib/          # Config & utilities
│   │   ├── config.ts
│   │   └── queryClient.ts
│   ├── components/   # Reusable components
│   ├── hooks/        # Custom hooks
│   └── types/        # TypeScript types
├── assets/           # Images & static files
├── app.json          # Expo configuration
└── package.json
```

## Backend Connection

The app connects to: `https://workspace.joehodgson0.repl.co`

Update `API_BASE_URL` in `src/lib/config.ts` if needed.

## Building for App Store

When ready to publish:

1. **Initialize EAS:**
   ```bash
   npx eas init
   ```

2. **Build for iOS:**
   ```bash
   npx eas build --platform ios
   ```

3. **Submit to App Store:**
   ```bash
   npx eas submit --platform ios
   ```

## Important Notes

- **New Architecture**: Disabled for Expo Go compatibility
- **Tunnel Mode**: Enabled by default for testing on Replit
- Uses the same backend API as the web application
