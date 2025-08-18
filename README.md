# Solar API 🌞

A NestJS-based REST API for Solar management system with role-based authentication and clean architecture principles.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 Role-based access control (RBAC)
- 🏗️ Clean architecture with domain-driven design
- 🗄️ MySQL database with Prisma ORM
- ✅ Comprehensive testing (Unit, Integration, E2E)
- 📚 OpenAPI/Swagger documentation
- 🔧 TypeScript with strict typing

## Tech Stack

- **Framework**: NestJS
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Testing**: Jest with Testcontainers
- **Documentation**: Swagger/OpenAPI

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

### Installation

```bash
# Clone the repository
$ git clone <repository-url>
$ cd Solar_BE

# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env
# Edit .env with your database credentials
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://root:password@localhost:3306/solar_db"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
```

## Database Management

### Quick Setup (Recommended)

```bash
# Complete database setup (generate client + migrate + seed)
$ npm run db:setup
```

### Individual Commands

```bash
# Generate Prisma client
$ npm run db:generate

# Development workflow
$ npm run db:migrate:dev     # Create and apply new migration
$ npm run db:seed           # Seed with development data

# Production deployment
$ npm run db:migrate        # Deploy migrations
$ npm run db:seed:prod      # Seed with production data

# Database utilities
$ npm run db:push           # Push schema changes (development only)
$ npm run db:reset          # Reset database and reseed
$ npm run db:studio         # Open Prisma Studio (database browser)

# Interactive database management
$ npm run db help           # Show all available commands
$ npm run db setup          # Interactive setup
$ npm run db migrate        # Interactive migration
```

## Running the Application

```bash
# Development mode with hot reload
$ npm run start:dev

# Production mode
$ npm run start:prod

# Debug mode
$ npm run start:debug
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the application is running, visit:

- Swagger UI: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`
