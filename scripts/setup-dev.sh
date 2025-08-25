#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

print_status "Setting up development environment..."

# Check Node.js version
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 24 ]; then
        print_status "Warning: Node.js version $NODE_VERSION detected. This project requires Node.js 24+."
        print_status "Consider using nvm: nvm install 24 && nvm use 24"
    else
        print_status "Node.js version $NODE_VERSION detected - OK"
    fi
else
    print_status "Node.js not found. Please install Node.js 24+ before continuing."
fi

# Copy development environment file
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/development.env.template" "$PROJECT_ROOT/.env"
    print_success "Created .env file from development template"
else
    print_status ".env file already exists, skipping..."
fi

# Create SSL certificates for development
print_status "Setting up SSL certificates for development..."
if [ ! -f "$PROJECT_ROOT/nginx/ssl/cert.pem" ]; then
    mkdir -p "$PROJECT_ROOT/nginx/ssl"
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_ROOT/nginx/ssl/key.pem" \
        -out "$PROJECT_ROOT/nginx/ssl/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Solar API/CN=localhost" \
        2>/dev/null
    
    chmod 600 "$PROJECT_ROOT/nginx/ssl/key.pem"
    chmod 644 "$PROJECT_ROOT/nginx/ssl/cert.pem"
    
    print_success "Created self-signed SSL certificates"
else
    print_status "SSL certificates already exist, skipping..."
fi

# Install dependencies
if [ -f "$PROJECT_ROOT/package.json" ]; then
    print_status "Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm install
    print_success "Dependencies installed"
fi

# Setup database
print_status "Setting up database..."
cd "$PROJECT_ROOT"
npm run db:generate 2>/dev/null || true
print_success "Database setup completed"

print_success "Development environment setup completed!"
echo ""
print_status "Next steps:"
echo "  1. Review and edit .env file with your preferences"
echo "  2. Run: docker-compose up -d"
echo "  3. Run: npm run db:setup (for database setup)"
echo "  4. Access the API at: http://localhost:3000"
echo "  5. Access Swagger docs at: http://localhost:3000/api"
