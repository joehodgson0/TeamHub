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

### October 2025 - Mobile Event Creation
- Added event creation capability for coaches/managers on mobile
- Created AddEventModal component (`mobile/src/components/modals/AddEventModal.tsx`) with full-featured event form
- Event types supported: Match, Tournament, Training, Social Event
- Conditional fields based on event type (opponent for matches, name for tournaments/social events)
- Date/time inputs for start and end times with validation
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