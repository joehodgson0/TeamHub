# TeamHub

## Overview

TeamHub is a full-stack application designed for managing youth football clubs. It provides tools for coaches and parents to manage teams, track player attendance, schedule events (matches, training, tournaments), and facilitate communication. The project aims to streamline club operations with role-based access control, offering a web application, a mobile application (React Native/Expo), and a shared Express.js backend with a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Web Application:**
-   **Framework:** React with TypeScript.
-   **Routing:** `wouter` for client-side routing with role-based access.
-   **State Management:** React Query for server state.
-   **UI:** `shadcn/ui` components on Radix UI primitives, styled with Tailwind CSS.
-   **Authentication:** Session-based with role-based access (coach/parent).

**Mobile Application:**
-   **Framework:** React Native with Expo (SDK 52+, React Native 0.76+).
-   **Routing:** Expo Router (file-based navigation).
-   **Styling:** NativeWind (Tailwind CSS for React Native).
-   **State Management:** React Query for API state.
-   **Navigation:** Bottom tabs for authenticated users, stack navigation for auth flow.
-   **Platform Support:** iOS and Android, New Architecture enabled.

### Backend Architecture

-   **Framework:** Express.js with TypeScript.
-   **Database ORM:** Drizzle ORM for PostgreSQL.
-   **API Design:** RESTful API under `/api` prefix, centralized error handling.
-   **Storage:** Abstracted `IStorage` interface for CRUD operations.
-   **Development:** Vite integration for HMR.

### Data Models

Uses Zod schemas for validation and modeling:
-   **User Management:** Users with roles (coach/parent), club associations, team memberships.
-   **Club System:** Clubs with unique 8-character codes.
-   **Team Management:** Teams with age groups, player rosters, win/loss tracking.
-   **Event System:** Fixtures (match, training, tournament) with attendance.
-   **Communication:** Posts with categories (kit requests, announcements).

### Authentication & Authorization

-   **Dual Authentication:** Supports Email/Password and Replit OAuth (Google) with automatic user provisioning.
-   **Role-Based Access Control:**
    -   **Coach:** Create teams, schedule fixtures, manage team posts, access all team data.
    -   **Parent:** Add dependents, join teams via codes, view relevant team info.
    -   Supports multi-role users.
-   **Session Management:** Authentication state persisted across sessions.

### UI/UX Decisions

-   Consistent design language across web and mobile using Tailwind CSS and Radix UI/NativeWind.
-   Interactive and user-friendly forms, especially for date/time selection on mobile.
-   Inline availability marking for parents on mobile event cards for improved UX.
-   Dynamic tab navigation on mobile based on user roles.

## External Dependencies

**Shared (Web & Mobile):**
-   **Database:** PostgreSQL (via Neon serverless).
-   **State Management:** React Query v5.
-   **Validation:** Zod.
-   **Date Management:** `date-fns`.

**Web-Specific:**
-   **UI Components:** Radix UI primitives, `shadcn/ui`.
-   **Styling:** Tailwind CSS.
-   **Build Tools:** Vite.
-   **Form Handling:** React Hook Form.

**Mobile-Specific:**
-   **Framework:** Expo SDK 52+, Expo Router.
-   **Styling:** NativeWind.
-   **Icons:** Lucide React Native (mobile), MaterialIcons.
-   **Navigation:** React Navigation (via Expo Router).

## Recent Changes

### November 2025 - AddEventModal Date Picker Fix
- Fixed date picker defaulting to January 1st instead of current date
- Date picker now initializes to today's date when creating new events
- Form properly resets all fields when modal is closed
- Preserved behavior: editing events still loads existing event dates
- Implementation: useEffect handles three scenarios (edit, open, close) with proper state management

### November 2025 - Add Dependent Modal DatePicker Fix
- Fixed DatePicker not loading by moving it inside Modal component
- DatePicker now properly appears above modal content with correct z-index
- Timezone-safe date formatting (YYYY-MM-DD) for API submission
- User-friendly date display format (e.g., "Wed, Jan 1, 2015")
- Default date set to 10 years ago with validation preventing future dates

### November 2025 - Mobile Keyboard Avoidance for All Forms
- Fixed keyboard obscuring forms and modals on mobile devices
- Added KeyboardAvoidingView to all modal components:
  - AddEventModal: Event creation and editing forms
  - CreateTeamModal: Team creation form
  - MatchResultModal: Match result entry with player stats
  - AvailabilityModal: Player availability marking
  - Add Dependent Modal: Add child/player to team
- Added KeyboardAvoidingView to authentication pages:
  - Register (Create Account): 5-field registration form
  - Login: Email and password form
- Platform-specific behavior (iOS: padding, Android: height)
- Enhanced ScrollView with keyboardShouldPersistTaps="handled" for better UX

### November 2025 - Event Filtering Fix
- Fixed event filtering to only show events from managed teams for coaches
- Coaches now only see events from teams in user.teamIds (teams they manage)
- Parents only see events from teams their dependents play on
- Users with both roles see events from both managed teams and dependent teams
- Updated both /api/events/all-session and /api/events/upcoming-session endpoints