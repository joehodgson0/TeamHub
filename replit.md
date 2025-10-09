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

**Environment-Based Authentication:**
- **Development Mode**: Uses email/password authentication only
  - Registration with email, first name, last name, and password
  - Session-based login with bcrypt password hashing
  - Traditional logout and session management
- **Production Mode**: Uses Replit OAuth (Google authentication) only
  - Google OAuth login via Replit's authentication service
  - Automatic user provisioning from OAuth claims
  - Token-based session management with refresh

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

### October 2025 - Environment-Based Authentication
- Modified authentication to use different methods based on environment:
  - **Development**: Email/password authentication only (for local development and testing)
  - **Production**: Replit OAuth (Google) authentication only (for deployed app)
- Updated landing page to conditionally display auth options based on environment
- Backend automatically configures auth strategy based on NODE_ENV
- Mobile app configured to use backend's email/password endpoints

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