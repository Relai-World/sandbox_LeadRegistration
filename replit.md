# Overview

This is a real estate CRM application built for managing property listings, builder onboarding, and lead management. The system supports two user types: administrators who manage verified properties and overall system data, and agents who submit property information through onboarding forms. The application features a React frontend with a Node.js/Express backend, using PostgreSQL via Drizzle ORM for local data and Supabase as the primary external database for property and user data.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **State Management**: TanStack React Query for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives wrapped in shadcn/ui components

## Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Authentication**: Session-based auth with Passport.js, bcrypt for password hashing
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

## Data Layer
- **Primary Database**: Supabase (external PostgreSQL) for user data, properties, and leads
- **Local Database**: PostgreSQL via Drizzle for sessions, profiles, and local property/lead tables
- **Schema Location**: `shared/schema.ts` contains all Drizzle table definitions
- **Migrations**: Drizzle Kit manages schema migrations in `./migrations` folder

## Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (shadcn/ui)
    hooks/        # Custom React hooks
    pages/        # Page components (AdminIndex, AgentIndex)
    lib/          # Utility functions
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  supabase.ts     # Supabase client initialization
  db.ts           # Drizzle/PostgreSQL connection
shared/           # Shared code between frontend and backend
  schema.ts       # Database schema definitions
  routes.ts       # API contract types with Zod
  models/         # Auth models
```

## Build System
- Development: `tsx` for running TypeScript directly
- Production: Custom build script using esbuild for server, Vite for client
- Output: Server bundles to `dist/index.cjs`, client to `dist/public`

# External Dependencies

## Database Services
- **Supabase**: Primary database for application data (UsersData table, properties, client_Requirements)
  - Requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables
  - Used for user authentication, property storage, and lead management

- **PostgreSQL**: Local database for sessions and Drizzle-managed tables
  - Requires `DATABASE_URL` environment variable
  - Managed via Drizzle ORM with migrations

## Key NPM Packages
- `@supabase/supabase-js`: Supabase client for external database operations
- `drizzle-orm` + `drizzle-kit`: ORM and migration tooling
- `express-session` + `connect-pg-simple`: Session management with PostgreSQL store
- `passport` + `passport-local`: Authentication middleware
- `bcryptjs`: Password hashing
- `zod`: Runtime type validation for API inputs

## Development Tools
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Replit-specific development features