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