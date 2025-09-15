# replit.md

## Overview

TeamHub is a full-stack web application for managing youth football clubs, teams, players, and events. It provides role-based access for coaches and parents, allowing them to manage teams, track player attendance, schedule fixtures, and communicate through posts and announcements. The application features a modern React frontend with shadcn/ui components and Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using React with TypeScript and implements a component-based architecture:

- **Routing**: Uses wouter for client-side routing with role-based access control
- **State Management**: Combines React Context (AuthManager) with React Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Storage Layer**: Implements both in-memory storage (MemStorage) for development and interfaces for database integration
- **Authentication**: Custom auth manager with role-based access (coach/parent roles)

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

Role-based access control system:

- **Coach Role**: Can create teams, schedule fixtures, manage team posts, view all team data
- **Parent Role**: Can add dependents (players), join teams via codes, view relevant team information
- **Multi-role Support**: Users can have both coach and parent roles simultaneously
- **Session Management**: Authentication state persisted across browser sessions

### External Dependencies

- **Database**: PostgreSQL with Neon serverless integration
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Date Management**: date-fns for date formatting and manipulation
- **Development Tools**: Vite for build tooling and development server
- **Replit Integration**: Custom plugins for Replit environment compatibility