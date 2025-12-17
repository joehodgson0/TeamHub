# TeamHub

## Overview

TeamHub is a full-stack application designed for managing youth football clubs. It provides tools for coaches and parents to manage teams, track player attendance, schedule events (matches, training, tournaments), and facilitate communication. The project aims to streamline club operations with role-based access control, offering a web application, a mobile application (React Native/Expo), and a shared Express.js backend with a PostgreSQL database. The business vision is to empower youth sports organizations with efficient, integrated management tools, tapping into a market eager for streamlined administrative processes.

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
-   Keyboard avoidance implemented for all forms and modals on mobile.
-   Sequential date/time picker for improved mobile usability.
-   Pull-to-refresh functionality on all main mobile pages (Dashboard, Events, Teams, Posts) with React Query cache invalidation.

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

### November 2025 - Mobile UI/UX Enhancements
- **Dashboard Widget Improvements:**
  - Redesigned Upcoming Events and Fixtures widgets with better spacing, typography, and visual hierarchy
  - Added Lucide icons (Calendar, Clock, MapPin, Users) replacing emojis for professional appearance
  - Match cards show "Team vs Opponent" format prominently at top
  - Tournament cards show event name instead of vs format
  - Team names now include age groups (e.g., "U12 Team", "U14 Falcons")
  - Recent Results widget shows team vs opponent with bold formatting
- **Tab Navigation Enhancement:**
  - Replaced default icons with professional Lucide icons (LayoutDashboard, Users, Baby, Calendar, MessageSquare, Settings)
  - Added color scheme: active tabs blue (#2563EB), inactive gray (#6B7280)
- **Events Page Improvements:**
  - Match cards prominently display team vs opponent at top
  - Tournament cards show event name with team below
  - Player availability section made more compact (25-30% less space)
  - Team names include age groups throughout

### November 2025 - Dashboard Filtering Fixes
- **Fixed Multi-Role User Event Filtering:**
  - Issue: Users with both coach and parent roles only saw events from dependents' teams
  - Solution: Dashboard widgets now combine teams from both roles (coach teams + dependent teams)
  - Applies to: Upcoming Events, Upcoming Fixtures, and Recent Results widgets
  - Users now see all relevant events/results from all associated teams

### November 2025 - Drizzle ORM Field Mapping Fix
- **Fixed Database Column Mapping:**
  - Added `casing: 'snake_case'` to Drizzle database initialization (server/db.ts)
  - Enables automatic mapping between camelCase (JS) and snake_case (PostgreSQL)
  - Fixed authorId, authorName fields not appearing in post queries
  - Post delete operation now works correctly with `.returning()` method

### November 2025 - Mobile Edit/Delete Post Functionality Added
- Implemented edit and delete functionality for posts on mobile app (feature parity with web)
- Users can now edit their own posts via an edit icon on each post card
- Users can delete their own posts with a confirmation dialog
- Edit/delete actions only visible to post authors (permission check: `post.authorId === user.id`)
- Edit modal pre-populates with existing post data for easy modification
- Delete confirmation prevents accidental deletions
- Both actions invalidate React Query cache to update UI immediately

### November 2025 - Pull-to-Refresh Functionality Added
- Implemented native pull-to-refresh on all main mobile pages (Dashboard, Events, Teams, Posts)
- Users can swipe down to refresh data with visual loading spinner
- Each page invalidates its specific React Query caches for fresh data
- Dashboard refreshes: events, players, match results, teams, and posts
- Events page refreshes: events, teams, players, and match results
- Teams page refreshes: teams and club data
- Posts page refreshes: posts, teams, and players
- Provides standard mobile UX pattern for manual data refresh

### December 2025 - Mobile Tab Navigation Performance Fix
- **Created UserContext for instant user data access:**
  - Replaced React Query-based useAuth hook with in-memory UserContext
  - User data is cached in module-level variable for instant access on tab switches
  - Eliminates network round-trips when navigating between tabs
- **Updated all auth flows to call refreshUser():**
  - Login, Register, and Role-Selection pages now properly populate the user cache after authentication
  - Ensures users are correctly routed to tabs after successful login
- **Logout properly clears all cached data:**
  - Clears both UserContext cache and React Query cache
  - Prevents stale data leakage between user sessions
- **Tab layout optimized with memoization:**
  - Tab layout wrapped with React.memo to prevent unnecessary re-renders
  - Uses cached user data from context instead of making API calls

### November 2025 - Mobile Logout Cache Clearing Fix
- Fixed critical data leakage issue where previous user's data persisted after logout
- Issue: React Query cache not cleared on logout, causing new user to see old user's data
- Solution: Changed logout to call `queryClient.clear()` to remove ALL cached data
- Prevents events, posts, teams, players, and other data from leaking between user sessions
- Users now see only their own data immediately after logging in