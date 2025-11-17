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

### November 2025 - Pull-to-Refresh Functionality Added
- Implemented native pull-to-refresh on all main mobile pages (Dashboard, Events, Teams, Posts)
- Users can swipe down to refresh data with visual loading spinner
- Each page invalidates its specific React Query caches for fresh data
- Dashboard refreshes: events, players, match results, teams, and posts
- Events page refreshes: events, teams, players, and match results
- Teams page refreshes: teams and club data
- Posts page refreshes: posts, teams, and players
- Provides standard mobile UX pattern for manual data refresh

### November 2025 - Mobile Logout Cache Clearing Fix
- Fixed critical data leakage issue where previous user's data persisted after logout
- Issue: React Query cache not cleared on logout, causing new user to see old user's data
- Solution: Changed logout to call `queryClient.clear()` to remove ALL cached data
- Prevents events, posts, teams, players, and other data from leaking between user sessions
- Users now see only their own data immediately after logging in