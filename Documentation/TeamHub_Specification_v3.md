# TeamHub

**Version:** 3.0  
**Date:** September 04, 2025  
**Author:** Joseph Hodgson

## Purpose

This updated document refines the specification template for developing a team management application, focusing on sports teams and clubs. It incorporates specific features like team setup, fixture management with locations and timings, manager posts for recruitment, kit management, and match updates/scores.

## Scope

The application ("TeamHub"), emphasizing team organization, event scheduling (matches, training, tournaments, socials), centralized communication, and administrative tools. It targets sports clubs with up to 2,000 members, accessible via web, and at a later date mobile (iOS/Android), and tablet.

## Overview

### 1.1 Product Description

TeamHub is a comprehensive platform for sports team and club management, enabling managers, coaches, players, and parents to handle logistics efficiently. It includes rapid team setup, fixture scheduling with locations/timings, centralized chats, recruitment posts, kit tracking, and real-time match updates/scores. The app reduces administrative hassle, fosters engagement, and ensures safeguarding.

### 1.2 Target Audience

**Managers/Coaches:** Set up teams, schedule events, post recruitment needs, manage kits, update scores.

**Players/Parents:** Respond to availability, chat, view fixtures/locations

**Club Admins:** Oversee multiple teams

### 1.3 Business Objectives

- Simplify event scheduling (matches, training, tournaments, socials) with locations, timings, and reminders.
- Provide a central hub for chats and posts (e.g., recruitment, updates).
- Support kit management and match score tracking for better organization.

### 1.4 Assumptions and Constraints

Client side code only using local browser storage for prototyping with a move to .NET backend and SQL storage at a later date

## Features

### Minimal Viable Product

#### Registration

Users can register to the application using their email and password. Future releases will allow authentication via external sources such as their google account. logout, login, forgot password will be available as standard. When registered a wizard will be shown which be used to capture information about the user such as their role (coach/manager and/or parent/guardian).

#### Club Association

When registered, if the user selected yes to being a coach/manager, the user can associate to a club using a unique code (8 alphanumeric characters) which is generated when the club is created. For MVP their will be only one club called 'Hilly Fielders' and the unique code will be any code that starts with a 1. A code that does not start with a 1 will show an error 'no club found with that code'

#### Team Creation

When logged in as a club manager, the option to create a team for the club will be available. A team is created with a name and an age group (U7 to U21) and it is assigned a unique code (8 alphanumeric characters).

#### Team association

When registered, if the user selected yes to be a parent/guardian associate to a team using a unique code (8 alphanumeric characters) which is generated when the team is created. For the MVP there will be only one team called 'U12 Eagles' and again association will work with any code that starts with a 1. A code that does not start with a 1 will show an error 'no team found with that code'

#### Dashboard

The dashboard will be the main landing page for all users and will display a number of 'widgets' each in their own dedicated section of the page and each providing useful information such as:

- **Upcoming Events** which shows relevant events for the users such as fixtures and social events. For team managers this could include monthly meetings
- **Team stats** which shows information about how the team as done (win, draws and losses) for the current season and for previous seasons
- **Player attendance** shows the amount of attendance the player they are the parent or guardian for has made across fixtures, training and other events
- **Match results** shows results of any fixtures across the club with their team(s) highlighted at the top
- **Team posts** which will include messages posted by team and club managers

#### Fixture Management

The fixture management section of the site will be were coaches can add/update fixtures for the team and where parents or guardians or players in the team and show availability for upcoming fixtures. Fixtures will contain details like the type (match, friendly, tournament, training, social) a name for the fixture, the opponent if necessary, the location (free text but will be integrated with google maps at a later date), start and end times and finally additional information (free text)

#### Match Updates

All fixtures will have the ability for coaches to edit the fixture and enter the final result. This information will be available for dashboards for all users assigned to the same club to see in the 'Match results' section.

#### Manager Posts

Managers (club and team) will be able to post messages that will be available to all users on their dashboards. Club manager posts will be on all dashboards and team manager posts will be shown on the dashboards of users associated with the team

#### Team Awards

Any awards given to players will be shown on the team dashboard

#### Kit Management

Team managers can post requests for kit which will be shown on the dashboards of all other team managers in the same club.

#### Club-wide calendar

Club managers will be able to add events to a club wide calendar which can be then visible on dashboards for all users to see the upcoming events

#### Social events

Social events for the club and for the team can be created and will be shown on the upcoming events section of the dashboard. Social events which can include meetings that are created by club managers will be shown to all team managers in the club and social events created by team managers will be shown to all users associated with the team.

#### New player requests

Team managers can post requests for new players which will be shown on the dashboards of all other team managers in the same club.

#### DBS & Safeguarding

Parental consent and details

### Future Releases

#### Mobile and tablet

The application will be initially web only but will eventually be available via a downloadable app for Android and IOS users

#### Payments & Fee Collection

#### Reports

Exportable reports for attendance, payments, availability.

#### New Team onboarding checklist

#### New Player onboarding checklist

#### Media Gallery

Upload/tag photos/videos from events.

## Functionality

### 3.1 User Roles and Permissions

**Manager/Coach:** Full control over team setup, fixtures, chats, posts (recruitment, kits), score updates.

**Player:** View fixtures/locations/timings, confirm availability, chat, pay fees.

**Parent:** Access junior-specific info, chats; safeguarding inclusions.

**Admin:** Club branding, data management, multi-team oversight.

### 3.2 Core Workflows

Please see the section Scenarios for steps outlining the core workflows

### 3.2 Application

#### Header

Shows the current club name, current user's role(s), the current user name, email and a logout button

#### Left hand pane

The following are available on the left hand side of the page

- Dashboard
- Club
- Team
- Events
- Dependents
- Posts
- Settings

#### Dashboard

Shows specific 'widgets' with valuable information to the logged in user

#### Footer

Shows the current club name and current season

### 3.3 Non-Functional Requirements

**Performance:** <2s for chat updates; handle high-volume notifications.

**Security:** Encrypted player data; GDPR for contacts.

**Usability:** Mobile-first; offline access for schedules.

**Accessibility:** WCAG 2.1 compliant.

## High-Level Architecture

### 4.1 Technology Stack

**Backend:** .NET 8 ASP.NET Core Web API; Entity Framework Core.

**Frontend:** .NET MAUI for mobile; Blazor for web.

**Database:** SQL Server (players/fixtures); Cosmos DB (chats/logs).

**Real-Time:** SignalR for chats/scores.

**Cloud:** Azure (hosting, storage for media/kits).

**Auth:** ASP.NET Identity; JWT.

### 4.2 System Components

- API for team setup, fixtures, chats, posts.
- Client apps with role-based UIs.
- External: Payment gateways, maps.

### 4.3 Data Flow

Manager creates fixture → API stores with location/timing → Notify users → Responses update DB → Real-time chat/score pushes via SignalR.