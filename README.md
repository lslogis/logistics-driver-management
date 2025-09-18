# Logistics Driver Management System

A comprehensive Next.js 14 logistics management system built with TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker Desktop installed
- Node.js 18+ (for local development)
- Git

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd logistics-driver-management
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the development environment:
```bash
docker-compose up --build
```

The application will be available at:
- Application: http://localhost:3000
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050

## Development

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

### NPM Scripts

```bash
# Development
npm run dev           # Start Next.js development server
npm run dev:docker    # Start with Docker

# Building
npm run build         # Build production bundle
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint code analysis

# Database
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed test data
npm run db:studio     # Open Prisma Studio

# Testing
npm test              # Run unit tests
npm run test:watch    # Jest watch mode
npm run test:e2e      # Playwright E2E tests
```

## Troubleshooting

### Prisma Permission Errors

If you encounter Prisma permission errors like:
```
Error: Can't write to /app/node_modules/prisma please make sure you install "prisma" with the right permissions.
```

Or:
```
EACCES: permission denied, unlink '/app/node_modules/.prisma/client/index.js'
```

#### Solutions:

1. **Quick Fix - Run the fix script:**
```bash
# On Windows (Git Bash)
bash scripts/fix-prisma.sh

# On Linux/Mac
chmod +x scripts/fix-prisma.sh
./scripts/fix-prisma.sh
```

2. **Docker Container Fix:**
```bash
# Rebuild the container with proper permissions
docker-compose down
docker-compose build --no-cache app
docker-compose up
```

3. **Manual Fix Inside Container:**
```bash
# Enter the container as root
docker exec -u root -it logistics-driver-management-app-1 bash

# Fix permissions
chown -R node:node /app/node_modules
chmod -R 755 /app/node_modules/.prisma
chmod -R 755 /app/node_modules/@prisma

# Regenerate Prisma client
npx prisma generate --schema=prisma/schema.prisma

# Exit container
exit

# Restart the container
docker-compose restart app
```

4. **Local Development Fix:**
```bash
# Clean node_modules
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall with proper permissions
npm install --unsafe-perm

# Regenerate Prisma client
npx prisma generate
```

5. **CI/CD Pipeline Fix:**

Add this to your CI/CD pipeline after `npm install`:
```yaml
- name: Generate Prisma Client
  run: |
    npx prisma generate --schema=prisma/schema.prisma
    chmod -R 755 node_modules/.prisma
```

### Common Issues

#### Port Already in Use
```bash
# Change port in docker-compose.yml or .env
APP_PORT=3001 docker-compose up
```

#### Database Connection Issues
```bash
# Ensure database is healthy
docker-compose ps
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up
```

#### Build Errors
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (RESTful design)
│   ├── drivers/           # Driver management
│   ├── charters/          # Charter/Request management
│   ├── loading-points/    # Loading point management
│   └── settlements/       # Financial settlements
├── components/            # Reusable React components
├── lib/                   # Utility libraries and services
│   ├── api/              # API client functions
│   ├── services/         # Business logic services
│   └── validations/      # Zod validation schemas
└── hooks/                # Custom React hooks
```

## Features

- **Driver Management**: Complete driver information system
- **Charter Management**: Request/Dispatch pattern for logistics operations
- **Loading Points**: Hierarchical location management (Centers → Loading Points)
- **Rate Management**: Dynamic fare calculation with center-based rates
- **Settlement Processing**: Financial calculations and driver payments
- **Role-Based Access**: ADMIN, DISPATCHER, ACCOUNTANT roles

## License

Proprietary - All rights reserved