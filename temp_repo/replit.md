# Overview

This real estate CRM application streamlines builder onboarding and property project management. It enables real estate agents to submit detailed property information through short or full forms, which administrators then review and verify. The system captures comprehensive property data, including RERA compliance, pricing, configurations, and commission details, aiming to streamline the project submission and approval process for real estate developments. The project's ambition is to create an efficient, error-reduced platform for managing real estate listings from submission to verification, enhancing data consistency and user experience for both agents and administrators.

# Recent Changes (November 29, 2025)

**CP Checkbox Added to POC Information Section:**
- Added new "CP" (Channel Partner) boolean checkbox field to Point of Contact (POC) section
- Implemented in both short form (ShortFormOnboarding.tsx) and long form (SecondaryDetails.tsx)
- CP field is part of each POC entry in the pocDetails array
- Updated MongoDB models (UnVerifiedResidentialModel.js, VerifiedResidentialModel.js) with POC_CP field
- Backend controllers (SupabasePropertyController.js, AdminPropertyController.js, VerifiedResidentialController.js) updated to handle POC_CP data flow
- Full persistence support: data saves to Supabase and loads correctly when editing drafts

# Previous Changes (November 28, 2025)

**Lead Registration UI Redesigned (Agent Dashboard):**
- Redesigned Lead Registration page with two-partition master-detail layout
- Left partition: Displays all leads with client name and mobile number (clickable to select)
- Right partition: Shows shortlisted properties for selected lead with:
  - Builder Name
  - Project Name
  - RERA Number
  - Contact details (Mobile, WhatsApp, Email, Role)
- Selected lead summary card with quick access to view full details or edit
- Improved search functionality and visual hierarchy

**Previous: Lead Registration Feature Added (Agent Dashboard):**
- Added new "Lead Registration" sidebar item in the agent dashboard
- Fetches data from Supabase `client_Requirements` table
- Full CRUD functionality: view, create, edit, and delete lead registrations
- Displays client requirements with preferences (budget, location, property type, bedrooms, area)
- Shows matched properties, shortlisted properties, and site visits counts
- Search functionality by mobile number, requirement name, or location
- Update operations preserve existing array fields (matched_properties, shortlisted_properties, site_visits)
- Backend API routes at `/api/lead-registration` with endpoints for GET, POST, PUT, DELETE

**Previous: Builder Data Management Feature Added:**
- Added new "Builder Data" menu item to admin sidebar for managing builder information
- Created BuilderData.tsx component with searchable table, add/edit/delete functionality
- Form includes three sections: top row (RERA Number*, Builder Name*, Project Name*), and detailed builder fields below
- All three fields in the top row are mandatory (marked with red asterisks)
- Project Name is a text input field (not a dropdown)
- Backend API routes at `/api/builder-data` with full CRUD operations for `builder_data` Supabase table
- When saving builder data, the `unified_data` table is automatically updated with both the builder name and RERA number
- Removed duplicate "RERA Builder Name" field - kept only the single "Builder Name" field
- Feature is protected with admin authentication middleware

# Previous Changes (November 21, 2025)

**Carpet Area % Made Optional:**
- Removed asterisk (*) from "Carpet Area %" field label in short form
- Updated validation logic to not require this field
- Changed MongoDB schemas (UnVerifiedResidentialModel and VerifiedResidentialModel) to set `Carpet_area_Percentage` as `required: false`

**Fixed Duplicate Project Name Issue:**
- Modified `GetPropertyDetails` endpoint to use **exact matching** (.eq) for project names instead of case-insensitive matching (.ilike)
- This ensures properties with similar names but different casing (e.g., "INDRAPRASTHA" vs "Indraprastha") are treated as distinct properties
- Updated autocomplete component to normalize user input by finding exact matches from the dropdown options, preventing 404 errors from manual entry with different casing
- RERA number lookups remain case-insensitive for backward compatibility

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite
- React Router
- TanStack React Query
- Shadcn UI with Radix UI
- Tailwind CSS

**Design Patterns:**
- Component-based architecture with React Hooks.
- Custom hooks for authentication, dropdown logic, and state management.
- Route-based code splitting.
- Controlled components for form state.
- Mobile-first responsive design.

**Key Architectural Decisions:**
- **Dual Portal System**: Separate agent (`/agent`) and admin (`/admin`) interfaces.
- **Client-Side Routing**: For seamless navigation.
- **Form Flexibility**: Short and full onboarding forms with dynamic field auto-population.
- **Draft System**: Agents can save and resume incomplete submissions, with robust draft loading for various project types.
- **Supabase Authentication**: Agent login uses Supabase PostgreSQL for user authentication with bcrypt password hashing.
- **Supabase Property Storage**: Property data (drafts and submissions) stored in Supabase `Unverified_Properties` table.
- **Same-Origin API Calls**: Frontend uses `window.location.origin` for API calls to ensure it always communicates with the correct backend.
- **Local Authentication State**: Auth state persisted in `localStorage`.
- **Data Normalization**: Helper functions for consistent data transformation (e.g., unit types) across frontend and backend.
- **Dynamic UI**: Unit configuration fields adapt based on project type (Villa vs. Apartment).

## Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- MongoDB with Mongoose (for legacy data and master property list)
- Supabase (for user authentication and property submissions)
- @supabase/supabase-js client library
- bcryptjs for password hashing
- CORS middleware

**Design Patterns:**
- MVC (Model-View-Controller) pattern.
- Modular route organization.
- Centralized CORS configuration.
- Environment variable configuration.

**Key Architectural Decisions:**
- **Hybrid Database Architecture**: MongoDB for master property list, Supabase PostgreSQL for user authentication and property submissions.
- **Flexible CORS**: Dynamic origin validation for development and production.
- **Schema Validation**: Mongoose schemas for MongoDB, Supabase table constraints for property data.
- **Status Tracking**: Properties have `Unverified` and `Verified` statuses.
- **Email-Based Filtering**: For multi-tenant operation.
- **Master Property Database**: `PropertiesModel` (MongoDB) serves as a source for autocomplete and auto-population features.
- **Supabase Service Key**: Uses service role key for server-side operations, bypassing RLS policies.
- **Upsert Logic**: Property saves support both insert (new properties) and update (existing drafts) based on RERA number.

**Data Models:**
- **Supabase Unverified_Properties Table**: Property submissions and drafts with fields: id (uuid), rera_number, projectname, buildername, configurations (jsonb), status, useremail, etc.
- **Supabase UsersData Table**: User authentication with fields: id (uuid), username, email, password (hashed), role, created_at.
- **MongoDB PropertiesModel**: Master property database for autocomplete dropdowns.

## Data Flow

Agents submit data via short or full forms, which are saved as drafts or submissions in Supabase. Drafts can be loaded from the Drafts tab and completed using the full form. All property data is stored in Supabase `Unverified_Properties` table with appropriate status tracking. Administrators review and verify submissions. The admin dashboard features a two-tab system to separate verified properties from project submissions, each with dedicated statistics and filtering capabilities.

## Data Validation Challenges

The system addresses inconsistencies in unit types (e.g., "2BHK" vs "2 BHK"), casing issues, and ensures numeric field validation through frontend data transformation, backend validation, and default value assignments. Field mapping between frontend (PascalCase) and Supabase (snake_case) requires careful transformation to preserve data integrity.

# External Dependencies

## Databases

**MongoDB:**
- Master property database for autocomplete and auto-population features.
- Used for `Properties` collection.

**Supabase PostgreSQL:**
- User authentication database (`UsersData` table).
- Property submissions and drafts database (`Unverified_Properties` table).
- Builder data management (`builder_data` table with fields: id, rera_builder_name, standard_builder_name, builder_age, builder_total_properties, builder_upcoming_properties, builder_completed_properties, builder_ongoing_projects, builder_origin_city, builder_operating_locations, previous_complaints_on_builder, created_at, updated_at).
- Unified property data (`unified_data` table) - linked to builder_data via buildername field.
- Client requirements/leads (`client_Requirements` table with fields: id, created_at, client_mobile, requirement_number, requirement_name, preferences (jsonb), matched_properties (jsonb), shortlisted_properties (jsonb), site_visits (jsonb), updated_at).
- Accessed via Supabase client with service role key for server-side operations.

## Build & Development Tools

**Frontend:**
- **Vite**: Development server and build tool.
- **TypeScript**: For type safety.
- **ESLint**: For code quality.
- **PostCSS**: With Tailwind and Autoprefixer.

**Backend:**
- **Nodemon**: For automatic server restarts during development.

## UI Libraries

**Shadcn UI Components:**
- Accessible components built on Radix UI primitives, styled with Tailwind CSS.

**Icons:**
- Lucide React for consistent iconography.

## Deployment Configuration

**CORS Whitelist:**
- Configured for local development, custom domains (`builder-onboarding.relai.world`), and Replit deployments (`.replit.dev`, `.replit.app`).

**Environment Variables:**
- `VITE_API_BASE_URL` for frontend API (defaults to `window.location.origin`).
- `MONGODB_URI` for MongoDB connection string.
- `SUPABASE_URL` for Supabase project URL.
- `SUPABASE_SERVICE_KEY` for Supabase service role authentication.
- `PORT` for backend server port (default 3001).