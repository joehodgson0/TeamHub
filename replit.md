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

### November 2025 - RecentResultsWidget Enhancement
- Enhanced mobile RecentResultsWidget to show complete match information
- Added team name display prominently at the top of each result
- Improved layout hierarchy: Team name → Opponent → Date
- Added fallback handling for missing opponent/date data
- Widget now receives teams array to resolve team names from IDs
- Score display preserved from backend enrichment (team perspective)
- Consistent with data already provided by backend score calculation
- Team names now display with age group prefix (e.g., "U12 Eagles" instead of "Eagles")

### November 2025 - Mobile Dashboard Widget Refactoring
- Refactored mobile dashboard from inline widgets to reusable components
- Created widget component architecture matching web app pattern:
  - `WidgetCard`: Wrapper component for consistent styling
  - `RecentResultsWidget`: Match results display
  - `UpcomingFixturesWidget`: Upcoming matches with availability
  - `UpcomingEventsWidget`: Non-match events
  - `TeamPostsWidget`: Team posts and announcements
- Extracted shared utilities to `mobile/src/utils/dashboard.ts`
- Reduced dashboard file from 645 lines to ~230 lines (64% reduction)
- Improved code maintainability and testability
- Dashboard retains data fetching, widgets receive data as props

### November 2025 - Mobile Login Error Handling Fix
- Fixed recurring "JSON Parse error: Unexpected character: <" on mobile app login
- Added proactive content-type checking before parsing JSON responses
- Implemented specific error messages for different failure scenarios:
  - Server unavailable/sleeping: Clear message that server may be starting up
  - Network errors: Prompts user to check internet connection
  - Other errors: Generic fallback with error details
- Added "Retry" button to all error alerts for easy recovery
- Prevents app crashes when server is sleeping or unavailable
- PERMANENT FIX: No more daily credit usage for same error

### November 2025 - Match Results Caching Fix
- Fixed Recent Results not showing scores on mobile dashboard
- Disabled multiple layers of caching to ensure fresh data:
  - Backend: Added timestamp to responses to force unique ETags
  - Mobile: Set fetch cache to 'no-store'
  - Mobile: Set React Query staleTime and cacheTime to 0
- Match results now always display current scores (e.g., "1-0" instead of dash)
- Applies to both session-based and OAuth authentication endpoints

### November 2025 - CORS Configuration for Mobile App
- Fixed mobile app login error "JSON Parse error: Unexpected character: <"
- Added secure CORS middleware to server with allowlist-based origin validation
- Supports web app (Replit domains), mobile app (Expo URLs), and local development
- Prevents CSRF attacks by validating origins while allowing credentials
- Allowlist includes: .replit.dev domains, exp:// URLs, localhost, 127.0.0.1
- Mobile apps and native requests (no origin header) are supported

### November 2025 - Recent Results Dashboard Enhancement
- Fixed recent results card not showing scores or opponent names
- Backend now enriches match results with calculated score and opponent data
- Score displayed from team's perspective (e.g., "3-1" if team scored 3)
- Opponent name pulled from fixture data with fallback to "Unknown Opponent"
- Match date included with fallback to prevent "Invalid Date" errors
- Applied to both session and OAuth authentication endpoints

### November 2025 - Team Selection for Post Creation
- Fixed team-level posts not showing on dashboard by adding team selection to Create Post modal
- Mobile app: Added team selector with button UI for multi-team coaches, info box for single team
- Web app: Added team selector with dropdown for multi-team coaches, static info for single team
- Backend: Now requires and validates teamId for team-scoped posts instead of defaulting to first team
- Auto-selects first team as default for convenience (coaches can change selection)
- Validates user has permission to post to selected team (must be in user.teamIds)
- Dashboard Team Posts widget now correctly shows posts from all managed teams
- Solves issue where multi-team coaches could only post to their first team

### November 2025 - Create Post Modal Keyboard Avoidance
- Fixed keyboard blocking the Create Post modal form inputs on mobile
- Added KeyboardAvoidingView with platform-specific behavior (iOS: padding, Android: height)
- Added ScrollView with keyboardShouldPersistTaps="handled" for better UX
- Modal content now scrolls and adjusts when keyboard is visible
- All form inputs and buttons remain accessible while typing
- Matches the keyboard avoidance pattern used in other modals (AddEvent, MatchResult, etc.)

### November 2025 - Dashboard Availability Count Fix
- Fixed availability count to always show team roster size as denominator
- Previously only showed counts when at least one person had marked availability
- Now shows "0/N available" even when no one has responded (N = team player count)
- Uses team's playerIds.length as the total instead of counting responses
- Behavior: Team with 5 players and 0 responses shows "👥 0/5 available" instead of nothing

### November 2025 - Event Cache Invalidation Fix
- Fixed events not appearing immediately after creation/editing
- Updated cache invalidation to refresh both events page and dashboard
- All event mutations now invalidate both `/api/events/all-session` and `/api/events/upcoming-session`
- Affects: AddEventModal, MatchResultModal, AvailabilityModal
- No logout/login required to see changes

### November 2025 - Sequential Date/Time Picker Implementation
- Replaced combined datetime picker with sequential date → time picker flow
- Fixed issue where time selection wasn't available due to library limitations
- Works consistently on both iOS and Android platforms
- User flow: Select date → automatically shown time picker → combined and saved
- Maintains all existing features (auto-update end time, minimum date validation)
- No new dependencies required

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