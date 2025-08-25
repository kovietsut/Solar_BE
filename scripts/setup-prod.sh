#!/bin/bash

# Production Environment Setup Script
# This script helps set up the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

print_status "Setting up production environment..."

# Copy production environment template
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/production.env.template" "$PROJECT_ROOT/.env"
    print_success "Created .env file from production template"
    print_warning "IMPORTANT: Edit .env file with your actual production values!"
else
    print_warning ".env file already exists. Please ensure it contains production values."
fi

# Generate secure secrets
print_status "Generating secure secrets..."

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

echo ""
print_success "Generated secure secrets (save these securely):"
echo "=================================="
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD"
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD"
echo "=================================="
echo ""

# Update .env file with generated secrets
print_status "Updating .env file with generated secrets..."

# Use sed to replace placeholder values (works on both Linux and macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/CHANGE_THIS_JWT_SECRET_TO_STRONG_RANDOM_STRING/$JWT_SECRET/g" "$PROJECT_ROOT/.env"
    sed -i '' "s/CHANGE_THIS_REFRESH_SECRET_TO_STRONG_RANDOM_STRING/$JWT_REFRESH_SECRET/g" "$PROJECT_ROOT/.env"
    sed -i '' "s/CHANGE_THIS_ROOT_PASSWORD/$MYSQL_ROOT_PASSWORD/g" "$PROJECT_ROOT/.env"
    sed -i '' "s/CHANGE_THIS_PASSWORD/$MYSQL_PASSWORD/g" "$PROJECT_ROOT/.env"
else
    # Linux
    sed -i "s/CHANGE_THIS_JWT_SECRET_TO_STRONG_RANDOM_STRING/$JWT_SECRET/g" "$PROJECT_ROOT/.env"
    sed -i "s/CHANGE_THIS_REFRESH_SECRET_TO_STRONG_RANDOM_STRING/$JWT_REFRESH_SECRET/g" "$PROJECT_ROOT/.env"
    sed -i "s/CHANGE_THIS_ROOT_PASSWORD/$MYSQL_ROOT_PASSWORD/g" "$PROJECT_ROOT/.env"
    sed -i "s/CHANGE_THIS_PASSWORD/$MYSQL_PASSWORD/g" "$PROJECT_ROOT/.env"
fi

print_success "Updated .env file with generated secrets"

# Security checklist
print_status "Production Security Checklist:"
echo "=================================="
echo "[ ] Update VPS_HOST with your server IP"
echo "[ ] Update VPS_USER with your deployment user"
echo "[ ] Update DOCKER_REGISTRY with your registry URL"
echo "[ ] Setup SSL certificates (run: ./scripts/setup-ssl.sh)"
echo "[ ] Configure GitHub Secrets for CI/CD"
echo "[ ] Setup firewall on VPS server"
echo "[ ] Setup backup strategy"
echo "[ ] Configure monitoring and logging"
echo "=================================="

print_success "Production environment setup completed!"
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo "  1. Review and complete the security checklist above"
echo "  2. Edit .env file to set VPS_HOST and other server details"
echo "  3. Setup SSL certificates: ./scripts/setup-ssl.sh --type letsencrypt --domain your-domain.com --email admin@your-domain.com"
echo "  4. Configure GitHub repository secrets"
echo "  5. Test deployment: ./scripts/deploy.sh"
echo ""
print_error "DO NOT commit the .env file to version control!"
print_error "Store the generated secrets in a secure password manager!"
