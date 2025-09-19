# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Environment:**
- `docker-compose up --build` - Start the full development environment (Preferred over npm dev)
- `npm run dev:docker` - Alias for Docker development setup
- `npm run dev` - Direct Next.js development (not recommended, use Docker)

**Building and Type Checking:**
- `npm run build` - Build the Next.js application
- `npm run typecheck` - TypeScript compilation check
- `npm run lint` - ESLint code analysis

**Testing:**
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Jest in watch mode
- `npm run test:e2e` - Playwright end-to-end tests
- `npm run test:e2e:ui` - Playwright with UI mode
- `npm run test:charter` - Charter system integration tests
- `npm run test:migration` - Migration validation tests

**Database Operations:**
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio GUI

**Data Migration and Testing:**
- `npm run audit:charter` - Charter system validation audit
- `npm run verify:migration` - Verify Trip → Charter migration
- `npm run db:migrate:charter` - Run charter-specific migrations

## Feature Development Restrictions

**🚨 CRITICAL: Feature Modification Policy**

### Absolute Rules
1. **No Feature Addition**: Never add features unless explicitly requested by the user
2. **No Feature Removal**: Never remove features unless explicitly requested by the user
3. **Preserve Existing Functionality**: All implemented features must be maintained

### Allowed Operations
- ✅ Bug fixes
- ✅ Performance improvements
- ✅ UI/UX enhancements
- ✅ Code refactoring
- ✅ Type error fixes
- ✅ User-requested modifications only

### Prohibited Operations
- ❌ Arbitrary feature additions
- ❌ Arbitrary feature removals
- ❌ Structural changes without user request
- ❌ UI component additions/removals without user request
- 🔒 **Center Fare System Modifications Prohibited** (Complete implementation - integration changes only after other features completed)

## Architecture Overview

This is a **Next.js 14 logistics management system** built with TypeScript, Prisma, and PostgreSQL, containerized with Docker.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Validation**: Zod schemas
- **Authentication**: NextAuth.js
- **Testing**: Jest (unit), Playwright (e2e)
- **Development**: Docker Compose

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (RESTful design)
│   ├── auth/              # Authentication pages
│   ├── drivers/           # Driver management
│   ├── charters/          # Charter/Request management (new system)
│   ├── center-fares/      # Center fare rates (complete implementation)
│   ├── loading-points/    # Loading point management
│   ├── settlements/       # Financial settlements
│   └── [other-pages]/
├── components/            # Reusable React components
├── lib/                   # Utility libraries and services
│   ├── api/              # API client functions
│   ├── services/         # Business logic services
│   ├── validations/      # Zod validation schemas
│   └── utils/           # Helper utilities
└── hooks/               # Custom React hooks
```

### Database Architecture

**Core Domain Models:**
- **Users** - Authentication and role-based access (ADMIN, DISPATCHER, ACCOUNTANT)
- **Drivers** - Driver information with vehicles and contact details
- **LoadingPoints** - Pickup locations with center/loading point hierarchy
- **Requests/Dispatches** - New charter management system (Request → Dispatch pattern)
- **CenterFares** - Rate management with basic/stop fee structures
- **Settlements** - Financial calculations and driver payments
- **FixedContracts** - Recurring route contracts

**Migration Status:**
- ✅ **CharterRequest** (Legacy) → **Request/Dispatch** (New) - Completed migration
- 🔒 **CenterFares** system is fully implemented and modification-restricted

### API Design Patterns

**RESTful Conventions:**
- `GET /api/{resource}` - List with pagination and filtering
- `POST /api/{resource}` - Create new record
- `GET /api/{resource}/{id}` - Get single record
- `PUT /api/{resource}/{id}` - Update record
- `DELETE /api/{resource}/{id}` - Delete record

**Specialized Endpoints:**
- `POST /api/{resource}/bulk` - Bulk operations
- `GET /api/{resource}/export` - Data export
- `POST /api/{resource}/import` - Data import
- `POST /api/{resource}/{id}/toggle` - Status toggle operations

**Key API Groups:**
- `/api/requests` - Charter request management (new system)
- `/api/dispatches` - Driver dispatch assignments
- `/api/center-fares` - Rate calculation and management
- `/api/settlements` - Financial settlement processing
- `/api/loading-points` - Location and center management

### Service Layer Architecture

**Service Pattern Implementation:**
- `src/lib/services/` - Business logic isolation
- Input validation with Zod schemas
- Database operations through Prisma
- Error handling and response formatting
- Audit logging for critical operations

**Key Services:**
- `fare-calculation.service.ts` - Pricing logic and rate calculations
- `center-fare.service.ts` - Rate management and validation
- `settlement.service.ts` - Financial calculations and processing

### Development Workflow

**Environment Setup:**
1. Use Docker Compose for consistent development environment
2. Database runs in PostgreSQL container with health checks
3. Application hot-reloads with volume mounts for src/ directory

**Data Management:**
- Prisma schema defines all models and relationships
- Migration scripts handle data transitions (Trip → Charter)
- Seed scripts provide test data for development
- Audit scripts validate system integrity

**Testing Strategy:**
- Unit tests with Jest for business logic
- Integration tests for API endpoints
- E2E tests with Playwright for user workflows
- Migration validation scripts for data integrity

### Key Development Principles

**Code Organization:**
- Follow Next.js App Router conventions
- Use TypeScript path mapping (@/ aliases)
- Implement proper error boundaries and validation
- Maintain consistent API response formats

**Data Integrity:**
- Zod schemas for runtime validation
- Database constraints and relationships
- Audit logging for sensitive operations
- Transaction handling for complex operations

**Security Considerations:**
- NextAuth.js for authentication
- Role-based access control (RBAC)
- Input sanitization and validation
- Audit trails for administrative actions