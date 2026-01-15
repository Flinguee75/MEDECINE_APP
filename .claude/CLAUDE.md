# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **7-day MVP** for a hospital management system built as a **monorepo** with session-based authentication. The core workflow is: Appointment → Medical Consultation → Prescription → Lab Results → Doctor Review.

**Stack:**
- Backend: NestJS + Prisma + PostgreSQL + express-session
- Frontend: React + TypeScript + Material-UI + Vite
- Desktop: Electron (planned for Day 6)

**Key architectural decisions:**
- Monorepo architecture (backend and frontend in same repo)
- Session-based authentication (NOT JWT) with express-session
- Role-based access control: ADMIN, DOCTOR, BIOLOGIST, SECRETARY
- PostgreSQL with Prisma ORM v6.x (avoid v7+ due to config changes)

## Development Commands

### Starting the application
```bash
# Root directory - start both backend and frontend
npm run dev

# Backend only (http://localhost:3000/api)
npm run dev:backend
# or: cd backend && npm run start:dev

# Frontend only (http://localhost:5173)
npm run dev:frontend
# or: cd frontend && npm run dev
```

### Database operations
```bash
# Create/apply migrations
npm run db:migrate
# or: cd backend && npx prisma migrate dev

# Seed database with test data
npm run db:seed
# or: cd backend && npx prisma db seed

# Open Prisma Studio (GUI for database)
npm run db:studio
# or: cd backend && npx prisma studio

# Reset database (WARNING: deletes all data)
npm run db:reset
# or: cd backend && npx prisma migrate reset

# Regenerate Prisma Client after schema changes
cd backend && npx prisma generate
```

### Build commands
```bash
# Build backend
npm run build:backend
# or: cd backend && npm run build

# Build frontend
npm run build:frontend
# or: cd frontend && npm run build
```

### Code quality
```bash
# Lint backend code
cd backend && npm run lint

# Lint frontend code
cd frontend && npm run lint

# Run backend tests
cd backend && npm test
```

## Architecture Essentials

### Backend Module Structure (NestJS)

The backend follows NestJS modular architecture with this hierarchy:

1. **PrismaModule** - Global module providing database access to all other modules
2. **AuthModule** - Handles login/logout/session management
3. **Domain modules** - Patients, Appointments, Prescriptions, Results (to be created)

**Key patterns:**
- Each module has: controller (routes), service (business logic), DTOs (validation)
- Guards protect routes: `@UseGuards(AuthGuard)` for authentication, `@UseGuards(AuthGuard, RolesGuard)` for role-based access
- Decorators extract data: `@CurrentUser()` gets userId from session, `@Roles(Role.DOCTOR)` defines required roles
- All API routes prefixed with `/api` (set in main.ts)

**Session management:**
- Sessions stored in-memory (not persisted)
- Session contains only `userId` (string)
- Cookie maxAge: 24 hours
- Session type defined in `backend/src/types/session.d.ts`

### Frontend Architecture (React)

**Key patterns:**
- `AuthContext` provides global authentication state via `useAuth()` hook
- Protected routes use `ProtectedRoute` component that redirects to /login if not authenticated
- Public routes use `PublicRoute` component that redirects to /dashboard if already authenticated
- Material-UI theme defined in App.tsx with primary color #1976D2 (medical blue)

**Axios configuration:**
- Base URL: `http://localhost:3000/api`
- **CRITICAL:** `withCredentials: true` must be set for session cookies to work
- API service layer in `src/services/` abstracts HTTP calls

**State management:**
- AuthContext for authentication state (user, loading, login, logout)
- Local state with useState for component-specific data
- NO Redux or external state management libraries

### Database Schema (Prisma)

**Core models and relationships:**
```
User (4 roles: ADMIN, DOCTOR, BIOLOGIST, SECRETARY)
  ├─> Appointment (as doctor)
  └─> Prescription (as doctor)

Patient
  ├─> Appointment
  └─> Prescription

Appointment
  ├── belongs to Patient
  └── belongs to Doctor (User)

Prescription (status: CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED)
  ├── belongs to Patient
  ├── belongs to Doctor (User)
  └── has one Result

Result
  └── belongs to Prescription (one-to-one)
```

**Important:**
- All IDs are UUIDs (not auto-increment)
- Cascade deletes enabled on foreign keys
- Passwords hashed with bcrypt (never store plain text)
- Use `@map("table_name")` to define database table names (plural form)

### Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Backend validates with bcrypt, creates session with userId
3. Session cookie sent to frontend (httpOnly, 24h expiration)
4. Frontend stores user in AuthContext state
5. All subsequent requests include cookie automatically
6. `@UseGuards(AuthGuard)` on backend routes checks `session.userId`
7. Logout destroys session with `session.destroy()`

**Guards usage:**
```typescript
// Require authentication only
@UseGuards(AuthGuard)

// Require authentication + specific role(s)
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
// or multiple roles: @Roles(Role.DOCTOR, Role.ADMIN)
```

## Test Accounts

After running `npm run db:seed`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Biologist | biologist@hospital.com | biologist123 |
| Secretary | secretary@hospital.com | secretary123 |

## Common Workflows

### Adding a new backend module

1. Generate module: `cd backend && nest g module <name>`
2. Generate service: `nest g service <name>`
3. Generate controller: `nest g controller <name>`
4. Create DTOs in `<name>/dto/` with class-validator decorators
5. Import in app.module.ts
6. Add PrismaService to constructor if database access needed
7. Use `@UseGuards(AuthGuard, RolesGuard)` and `@Roles()` for protected routes

### Adding a new frontend page

1. Create folder in `src/pages/<PageName>/`
2. Create component file `<PageName>.tsx`
3. Add route in `App.tsx` Routes
4. Wrap with `ProtectedRoute` if authentication required
5. Use `useAuth()` hook to access current user
6. Create service functions in `src/services/` for API calls

### Modifying database schema

1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name <description>`
3. Prisma Client auto-generates TypeScript types
4. Update seed file if needed: `backend/prisma/seed.ts`
5. Test with `npm run db:seed`

## Critical Implementation Details

### Prisma Version Constraints

**Use Prisma v6.x, NOT v7+**
- v7 changed datasource URL configuration
- Current implementation uses `url = env("DATABASE_URL")` in schema.prisma
- If Prisma is upgraded to v7, migrations will break

### CORS Configuration

Backend main.ts configures CORS to accept frontend origin:
```typescript
cors({
  origin: 'http://localhost:5173',
  credentials: true,
})
```

**Both `origin` and `credentials: true` are required for sessions to work.**

### Import Style for express-session and cors

Use `require()` syntax, not ES6 imports:
```typescript
import session = require('express-session');
import cors = require('cors');
```

Standard ES6 imports cause TypeScript compilation errors with these libraries.

### Role-Based Access Pattern

When creating protected routes:
1. Apply `@UseGuards(AuthGuard)` first (checks authentication)
2. Apply `@UseGuards(RolesGuard)` second (checks roles)
3. Add `@Roles(Role.XXX)` decorator before the route handler
4. RolesGuard fetches user from database to check role (not from session)

### Frontend API Error Handling

All API errors should be caught and display user-friendly messages:
```typescript
try {
  await apiCall();
} catch (err: any) {
  const message = err.response?.data?.message || 'Generic error message';
  // Display message to user
}
```

## Development Principles for This Project

1. **Simplicity over features** - This is a 7-day MVP, avoid over-engineering
2. **No advanced security** - Basic bcrypt + sessions sufficient for MVP
3. **Desktop-only** - No mobile responsive design needed (min-width: 1024px)
4. **Session-based auth** - Don't add JWT or tokens
5. **Material-UI components** - Use MUI for all UI elements, no custom styling
6. **API response format** - All endpoints return `{ data: ..., message?: '...' }`

## Out of Scope (Do Not Implement)

- WebSocket/real-time notifications
- File upload/document management
- Email notifications
- Advanced calendar views
- Data export features
- Print functionality
- GDPR compliance features
- Password reset flows
- Two-factor authentication
- API rate limiting
- Logging/audit trails (beyond basic console.log)

## Documentation Files

Refer to these files for detailed specs:
- `ARCHITECTURE.md` - Complete technical architecture
- `API.md` - Full API endpoint documentation with examples
- `WIREFRAMES.md` - UI designs and Material-UI component mapping
- `INSTALL.md` - Setup instructions from scratch
- `STRUCTURE.md` - Detailed file/folder structure

## Quick Reference

**Backend port:** 3000
**Frontend port:** 5173
**Database:** PostgreSQL on localhost:5432
**Database name:** hospital_mvp
**Database user:** hospital_user
**Database password:** hospital_password

**Workflow statuses:**
- Appointment: SCHEDULED → COMPLETED/CANCELLED
- Prescription: CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED

