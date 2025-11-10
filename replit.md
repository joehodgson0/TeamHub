# replit.md

## Overview

TeamHub is a full-stack application for managing youth football clubs, teams, players, and events. It provides role-based access for coaches and parents, allowing them to manage teams, track player attendance, schedule fixtures, and communicate through posts and announcements.

The project consists of:
- **Web Application**: React frontend with shadcn/ui components
- **Mobile Application**: React Native app using Expo (in `mobile/` directory)
- **Backend API**: Express.js with PostgreSQL database (shared by both web and mobile)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

#### Web Application
The web frontend is built using React with TypeScript:

- **Routing**: Uses wouter for client-side routing with role-based access control
- **State Management**: React Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Authentication**: Session-based auth with role-based access (coach/parent roles)

#### Mobile Application
The mobile app is built using React Native with Expo:

- **Framework**: Expo SDK 52+ with React Native 0.76+
- **Routing**: Expo Router (file-based routing similar to Next.js)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Query for API state management
- **Navigation**: Bottom tabs for authenticated users, stack navigation for auth flow
- **Platform Support**: iOS and Android (with New Architecture enabled)

### Backend Architecture

The backend follows a RESTful API design pattern:

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **API Structure**: Routes organized under `/api` prefix with centralized error handling
- **Storage Interface**: Abstracted storage layer with IStorage interface for CRUD operations
- **Development Server**: Vite integration for hot module replacement in development

### Data Models

The application uses Zod schemas for type validation and data modeling:

- **User Management**: Users with roles (coach/parent), club associations, and team memberships
- **Club System**: Clubs with unique 8-character codes for easy joining
- **Team Management**: Teams with age groups, player rosters, and win/loss tracking
- **Event System**: Fixtures with types (match, training, tournament), attendance tracking
- **Communication**: Posts with categories (kit requests, announcements, events)

### Authentication & Authorization

**Dual Authentication System:**
- **Email/Password Authentication**: Always available
  - Registration with email, first name, last name, and password
  - Session-based login with bcrypt password hashing
  - Traditional logout and session management
- **Replit OAuth (Google)**: Available when REPLIT_DOMAINS is configured
  - Google OAuth login via Replit's authentication service
  - Automatic user provisioning from OAuth claims
  - Token-based session management with refresh
- Users can choose either authentication method on the landing page

**Role-Based Access Control:**
- **Coach Role**: Can create teams, schedule fixtures, manage team posts, view all team data
- **Parent Role**: Can add dependents (players), join teams via codes, view relevant team information
- **Multi-role Support**: Users can have both coach and parent roles simultaneously
- **Session Management**: Authentication state persisted across browser sessions

### External Dependencies

**Shared (Web & Mobile):**
- **Database**: PostgreSQL with Neon serverless integration
- **State Management**: React Query v5 for server state
- **Validation**: Zod schemas for type-safe data validation
- **Date Management**: date-fns for date formatting

**Web-Specific:**
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with CSS variables
- **Build Tools**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

**Mobile-Specific:**
- **Framework**: Expo SDK 52+ with Expo Router
- **Styling**: NativeWind (Tailwind for React Native)
- **Icons**: Lucide React Native
- **Navigation**: React Navigation (via Expo Router)

## Recent Changes

### November 2025 - Mobile Keyboard Avoidance for All Modals
- Fixed keyboard obscuring modals and forms on mobile devices
- Added KeyboardAvoidingView to all modal components:
  - AddEventModal: Event creation and editing forms
  - CreateTeamModal: Team creation form
  - MatchResultModal: Match result entry with player stats
  - AvailabilityModal: Player availability marking
- Platform-specific behavior (iOS: padding, Android: height)
- Enhanced ScrollView with keyboardShouldPersistTaps="handled" for better UX
- Keyboard no longer blocks bottom form fields and submit buttons

### November 2025 - Completed Events Display with Result Updates
- Mobile Events & Fixtures page now shows ALL events (upcoming and completed)
- Created `/api/events/all-session` and updated `/api/events/upcoming-session` endpoints
- **Correct event filtering**: Coaches see only events from teams they manage (user.teamIds), parents see only events from teams their dependents play on
- Added `isEventCompleted()` helper function to check if event endTime has passed
- **Upcoming events**: Coaches can edit, delete, and mark availability for their dependents
- **Completed events**: Only "Update Result" button shown for coaches on matches
- Availability controls (✓/✗ buttons) hidden for completed events
- Both coaches and parents can mark availability for their dependents on upcoming fixtures
- Events sorted by date (most recent first) to show latest completed events at top
- Users with both coach and parent roles see events from both managed teams and dependent teams
- Updated `getUserPlayersForEvent()` to work for both coaches and parents with dependents

### November 2025 - Mobile Inline Availability Marking for Parents
- Implemented inline availability marking directly on event cards for parents
- Parents see their dependents listed on event cards for teams they play on
- Each dependent has checkmark (✓) and X (✗) buttons for available/unavailable
- Buttons highlight green when marked available, red when marked unavailable
- Instant visual feedback without opening separate modal
- Smart filtering: only shows availability controls for events where parent's dependents play
- Uses PUT `/api/events/{eventId}/availability` endpoint
- Replaced modal-based approach with simpler inline UX (fewer clicks)
- Mobile: Integrated into mobile/app/(tabs)/events.tsx with inline player cards

### November 2025 - Mobile Event Edit Functionality
- Added Edit and Delete icon buttons to mobile Events page matching web design
- Edit icon (blue) and Delete icon (red) from MaterialIcons (@expo/vector-icons)
- Icons appear inline for coaches on events they manage
- Updated AddEventModal to support both add and edit modes
- Modal title changes to "Edit Event" when editing existing events
- Form properly resets when switching from edit mode back to add mode
- Added updateEventMutation using PUT request to `/api/events/{id}`
- Fixed React 19 compatibility by using MaterialIcons instead of lucide-react-native

### November 2025 - Comprehensive Event Display & Management
- Expanded Events & Fixtures section to show ALL event types (match, tournament, training, social)
- Previously only matches/tournaments were shown, now all event types are visible with full details
- Added team name display for all events (both web and mobile)
- Added edit/delete capabilities for coaches on all event types they manage
- Availability marking for parents works across all event types (web)
- Conditional rendering: opponent and match-specific features only show for match-type events
- Added delete functionality to mobile app with confirmation dialog
- Web: Modified fixture-list.tsx to remove type filtering and show all events
- Mobile: Added team fetching, delete mutation, and enhanced event cards with team names
- Improved event name display logic to handle all event types appropriately

### November 2025 - Update Result Availability Validation
- Added date/time validation for "Update Result" button in Events & Fixtures section
- Button only appears AFTER an event has ended (compares current time with event end time)
- Prevents coaches from entering match results before games are played
- Implemented consistently across both web and mobile apps
- Web: Added `new Date() > fixture.endTime` check in fixture-list.tsx
- Mobile: Added date comparison in `canUpdateResult` function in events.tsx

### November 2025 - Mobile Join Club Functionality
- Added Join Club form to mobile Teams page for coaches without a club
- Club code input with validation (8-character requirement)
- Integration with `/api/auth/associate-club-session` endpoint
- Success alerts display club name after successful join
- Automatically refreshes user session data after joining
- Demo information displayed showing valid club codes
- Matching feature parity with web Team Management section

### November 2025 - Mobile Team Creation
- Added Create Team functionality to mobile Teams page
- Created CreateTeamModal component (`mobile/src/components/modals/CreateTeamModal.tsx`)
- Modal includes team name input and age group selector (U7-U21)
- "+ Create Team" button visible in Teams page header for coaches
- Success alert displays generated team code after creation
- Automatically refreshes team list after successful creation
- Integration with `/api/teams` POST endpoint

### October 2025 - Smart DateTime Picker for Mobile Events
- Enhanced event creation with smart datetime picker UI
- Replaced text inputs with interactive button-based datetime selection
- Added modal-based datetime pickers with emoji indicators (📅 for date, 🕐 for time)
- Implemented automatic end time adjustment (2 hours after start time when changed)
- Display friendly formatted dates (e.g., "Mon, Jan 15, 2025") and times (e.g., "3:00 PM")
- Validation ensures end time is always after start time
- Clean modal overlay UI for intuitive datetime editing
- Improved UX without external dependencies or complex native picker integration

### October 2025 - Mobile Event Creation
- Added event creation capability for coaches/managers on mobile
- Created AddEventModal component (`mobile/src/components/modals/AddEventModal.tsx`) with full-featured event form
- Event types supported: Match, Tournament, Training, Social Event
- Conditional fields based on event type (opponent for matches, name for tournaments/social events)
- Team selection from user's managed teams
- Home/Away selection and friendly match checkbox for matches
- Integration with `/api/events` endpoint
- Success/error handling with native alerts
- Add Event button shown only to coaches in Events tab header

### October 2025 - Mobile Settings with Role Update
- Added role update functionality to mobile Settings page matching web capabilities
- Created Checkbox component (`mobile/src/components/ui/Checkbox.tsx`) for mobile UI
- Users can now select/deselect Coach/Manager and Parent/Guardian roles on mobile
- Integrated with `/api/auth/update-roles-session` endpoint for session-based auth
- Added `updateUserRoles` function to mobile useAuth hook
- Visual feedback with highlighted selected roles and loading states
- Success/error alerts for user feedback

### October 2025 - Mobile Posts & Events Fixes
- Fixed Posts tab to use `/api/posts-session` endpoint (session-based auth)
- Fixed Events tab to use `/api/events/upcoming-session` endpoint
- Enhanced Posts UI with color-coded category badges and author information
- Enhanced Events UI with event type badges and improved date formatting
- Added null safety for category formatting to prevent runtime errors

### October 2025 - Mobile Role-Based Tab Navigation
- Implemented dynamic tab navigation based on user roles in mobile app
- **Coach-only users** see: Dashboard, Team, Events, Posts, Settings
- **Parent-only users** see: Dashboard, Events, Dependents, Posts, Settings
- **Users with both roles** see: Dashboard, Team, Dependents, Events, Posts, Settings
- Created Teams page (`mobile/app/(tabs)/teams.tsx`) for team management on mobile
- Teams page displays team information, player rosters, and match records for coaches
- Tab visibility controlled using Expo Router's `href` option based on user roles

### October 2025 - Dual Authentication System
- Implemented dual authentication supporting both email/password and Replit OAuth
- Email/password authentication always available for flexibility
- Replit OAuth (Google) available when REPLIT_DOMAINS environment variable is configured
- Landing page displays both authentication options for user choice
- Mobile app uses email/password authentication endpoints

### January 2025 - Mobile App Phase 1 Implementation
- Created `mobile/` directory with React Native Expo application
- Implemented Expo Router file-based navigation with authentication flow
- Built authentication screens (Landing, Login, Register, Role Selection)
- Created bottom tab navigation for authenticated users (Dashboard, Teams, Events, Posts, Settings)
- Configured NativeWind for Tailwind CSS styling matching web theme
- Set up React Query integration with shared API client
- Implemented useAuth hook for mobile authentication state
- Added TypeScript path aliases for @/ and @shared imports
- Configured environment variables for API base URL (development/production)
- Successfully running on Expo Go with tunnel mode for device testing