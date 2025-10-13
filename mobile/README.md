# TeamHub Mobile App

React Native mobile application for TeamHub using Expo SDK 54.

## Features

### ✅ Authentication
- Landing page with app overview
- Email/password login and registration
- Role selection (Coach/Parent)
- Session-based authentication

### ✅ Main App Screens
- **Dashboard**: Overview with upcoming events and team stats
- **Teams**: View and manage teams
- **Events**: View fixtures and upcoming events
- **Posts**: Team announcements and updates
- **Settings**: User profile and logout

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
- **Expo Router** - File-based navigation with authentication flow
- **React Query** - Server state management
- **TypeScript** - Type safety
- **Same Backend** - Connects to the TeamHub web backend

## Project Structure

```
mobile/
├── app/
│   ├── (auth)/              # Authentication screens
│   │   ├── landing.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── role-selection.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Dashboard
│   │   ├── teams.tsx
│   │   ├── events.tsx
│   │   ├── posts.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx          # Root layout with auth guard
│   └── index.tsx            # Entry point
├── src/
│   ├── components/ui/       # Reusable UI components
│   ├── hooks/               # Custom hooks (useAuth)
│   └── lib/                 # Config & utilities
├── app.json                 # Expo configuration
└── package.json
```

## Backend Connection

The app connects to: `https://workspace.joehodgson0.repl.co`

All API requests use the same endpoints as the web application.

## Navigation Flow

1. **Unauthenticated**: Landing → Login/Register → Role Selection
2. **Authenticated**: Tab Navigation (Dashboard, Teams, Events, Posts, Settings)

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
- Uses email/password authentication (same as web)
- All data is synced with the web application
