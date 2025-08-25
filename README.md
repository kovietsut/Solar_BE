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

- Node.js (v24 or higher)
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

# Production deployment (IMPORTANT: Use these exact commands)
$ npm run db:generate       # Generate Prisma client first
$ npm run db:migrate        # Deploy migrations (uses prisma migrate deploy)
$ npm run db:seed:prod      # Seed with production data

# For fresh production setup
$ npm run db:generate && npm run db:migrate && npm run db:seed:prod

# Database utilities
$ npm run db:push           # Push schema changes (development only)
$ npm run db:reset          # Reset database and reseed
$ npm run db:studio         # Open Prisma Studio (database browser)

# Interactive database management
$ npm run db help           # Show all available commands
$ npm run db setup          # Interactive setup
$ npm run db migrate        # Interactive migration
```

## 🚀 Production Deployment

### Environment Consistency

To ensure both development and production environments have the same database structure:

1. **Always use migration commands** (never `db:push` in production)
2. **Follow the exact deployment sequence** shown above
3. **Test migrations locally first** using `npm run db:reset` to verify the complete flow

### Production Deployment Checklist

```bash
# 1. Backup production database (if existing)
# 2. Generate Prisma client
npm run db:generate

# 3. Deploy migrations (this applies all pending migrations)
npm run db:migrate

# 4. Seed production data
npm run db:seed:prod

# 5. Verify deployment
npm run db:generate  # Should show no changes needed
```

### Common Issues

- **Migration fails with "table doesn't exist"**: This means migration history is inconsistent. Contact the development team.
- **Different table names in dev vs prod**: Use the migration commands above, never `db:push` in production.
- **Schema drift**: Always use `prisma migrate dev` in development, never modify the database directly.

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
- Health Check: `http://localhost:3000/health`

## 🐳 Docker & Containerization

### Local Development with Docker

```bash
# Build and run with Docker Compose
$ docker-compose up -d

# View logs
$ docker-compose logs -f

# Stop services
$ docker-compose down

# Rebuild services
$ docker-compose up --build -d
```

### Production Deployment with Docker

```bash
# Set production environment variables
$ cp production.env.template .env
# Edit .env with your production values

# Deploy with production settings
$ docker-compose up -d

# Scale the application
$ docker-compose up --scale app=3 -d
```

### Environment Configuration

#### Quick Setup Scripts

For **Development**:

```bash
$ ./scripts/setup-dev.sh
```

For **Production**:

```bash
$ ./scripts/setup-prod.sh
```

#### Manual Setup

1. **Development**: Copy the development template:

```bash
$ cp development.env.template .env
```

2. **Production**: Copy the production template:

```bash
$ cp production.env.template .env
# Edit with your actual production values
```

The unified `docker-compose.yml` automatically adapts based on environment variables:

- **Development**: Builds locally, uses development settings
- **Production**: Uses pre-built images, production settings

## 🚀 CI/CD Pipeline

### GitHub Actions Setup

The project includes a comprehensive CI/CD pipeline that:

1. **Continuous Integration**:

   - Runs unit, integration, and E2E tests
   - Performs security scans
   - Builds Docker images
   - Pushes to GitHub Container Registry

2. **Continuous Deployment**:
   - Deploys to VPS server automatically on `main` branch
   - Runs database migrations
   - Performs health checks
   - Sends notifications

### Required GitHub Secrets

Configure these secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
# VPS Server Configuration
VPS_HOST=your.server.ip.address
VPS_USER=deploy
VPS_SSH_PRIVATE_KEY=your_private_ssh_key_content

# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=solar_db
MYSQL_USER=solar_user
MYSQL_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_64_chars_minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_64_chars_minimum
JWT_REFRESH_EXPIRES_IN=7d

# Deployment Configuration
DEPLOY_PATH=/opt/solar-api

# Optional: Discord Notifications
DISCORD_WEBHOOK=your_discord_webhook_url
```

### VPS Server Setup

1. **Prepare your VPS server**:

```bash
# Run the VPS setup script on your server
$ curl -fsSL https://raw.githubusercontent.com/your-username/solar-api/main/scripts/vps-setup.sh | bash

# Or manually:
$ scp scripts/vps-setup.sh user@your-server:~/
$ ssh user@your-server
$ chmod +x vps-setup.sh
$ ./vps-setup.sh
```

2. **Setup SSL certificates**:

```bash
# For development (self-signed)
$ ./scripts/setup-ssl.sh --type self-signed --domain your-domain.com

# For production (Let's Encrypt)
$ ./scripts/setup-ssl.sh --type letsencrypt --domain your-domain.com --email admin@your-domain.com
```

3. **Add SSH key for deployment**:

```bash
# Add your GitHub Actions public key to the deploy user
$ ssh-copy-id deploy@your-server
# Or manually add to /home/deploy/.ssh/authorized_keys
```

### Manual Deployment

For manual deployment to your VPS:

```bash
# Set environment variables
$ export VPS_HOST="your.server.ip.address"
$ export VPS_USER="deploy"
$ export MYSQL_ROOT_PASSWORD="your_password"
$ export MYSQL_PASSWORD="your_password"
$ export JWT_SECRET="your_jwt_secret"
$ export JWT_REFRESH_SECRET="your_refresh_secret"

# Run deployment script
$ ./scripts/deploy.sh
```

### Deployment Features

- **Zero-downtime deployment** with health checks
- **Automatic database migrations**
- **SSL/TLS termination** with Nginx
- **Security headers** and rate limiting
- **Automatic backups** before deployment
- **Log rotation** and monitoring
- **Container health checks**

## 🔒 Security Features

### Application Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation and sanitization
- Security headers (HSTS, CSP, etc.)

### Infrastructure Security

- Nginx reverse proxy with rate limiting
- SSL/TLS encryption
- Firewall configuration (UFW/firewalld)
- Fail2ban for intrusion prevention
- Docker security best practices
- Non-root container execution

### Environment Security

- Environment variable encryption
- Secret management with GitHub Secrets
- SSH key-based authentication
- Database connection encryption
- Container image vulnerability scanning

## 📊 Monitoring & Logging

### Health Monitoring

- Application health check endpoint: `/health`
- Container health checks
- Database connection monitoring
- Nginx status monitoring

### Logging

- Structured JSON logging
- Log rotation with retention policies
- Centralized logging with Docker
- Access logs with Nginx
- Error tracking and alerting

### Backup Strategy

- Automatic database backups before deployment
- Configurable backup retention
- Application data backup
- Configuration backup

## 🛠️ Maintenance

### Database Maintenance

```bash
# Create manual backup
$ docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
$ docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < backup_file.sql
```

### SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates (automatic via cron)
$ ./scripts/setup-ssl.sh --validate

# Manual renewal
$ certbot renew --force-renewal
```

### Log Management

```bash
# View application logs
$ docker-compose logs -f app

# View nginx logs
$ docker-compose logs -f nginx

# Clean up old logs
$ docker system prune -f
```
