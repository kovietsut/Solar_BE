#!/bin/bash

# Solar API Deployment Script
# This script deploys the Solar API to a VPS server using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_PATH="/opt/solar-api"

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BACKUP=false
FORCE_DEPLOY=false

# Function to print colored output
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

# Function to check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_deps+=("docker-compose")
    command -v ssh >/dev/null 2>&1 || missing_deps+=("ssh")
    command -v scp >/dev/null 2>&1 || missing_deps+=("scp")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies are installed."
}

# Function to validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    local missing_vars=()
    
    [ -z "$VPS_HOST" ] && missing_vars+=("VPS_HOST")
    [ -z "$VPS_USER" ] && missing_vars+=("VPS_USER")
    [ -z "$MYSQL_ROOT_PASSWORD" ] && missing_vars+=("MYSQL_ROOT_PASSWORD")
    [ -z "$MYSQL_PASSWORD" ] && missing_vars+=("MYSQL_PASSWORD")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    [ -z "$JWT_REFRESH_SECRET" ] && missing_vars+=("JWT_REFRESH_SECRET")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing environment variables: ${missing_vars[*]}"
        print_error "Please set the required environment variables and try again."
        exit 1
    fi
    
    print_success "Environment variables validated."
}

# Function to test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to VPS..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" exit 2>/dev/null; then
        print_success "SSH connection successful."
    else
        print_error "Failed to connect to VPS via SSH."
        print_error "Please check your SSH configuration and VPS credentials."
        exit 1
    fi
}

# Function to create backup
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "Skipping backup creation."
        return
    fi
    
    print_status "Creating backup..."
    
    local backup_date=$(date +"%Y%m%d_%H%M%S")
    local backup_dir="backup_$backup_date"
    
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $DEPLOY_PATH
        if [ -f docker-compose.yml ]; then
            echo "Creating backup directory: $backup_dir"
            mkdir -p backups/$backup_dir
            
            # Backup database
            docker-compose exec -T mysql mysqldump -u root -p\$MYSQL_ROOT_PASSWORD \$MYSQL_DATABASE > backups/$backup_dir/database.sql
            
            # Backup configuration files
            cp docker-compose.yml backups/$backup_dir/
            cp .env backups/$backup_dir/
            
            # Backup application data
            if [ -d uploads ]; then
                cp -r uploads backups/$backup_dir/
            fi
            
            echo "Backup created successfully in backups/$backup_dir"
        else
            echo "No existing deployment found. Skipping backup."
        fi
EOF
    
    print_success "Backup completed."
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Create deployment directory
    ssh "$VPS_USER@$VPS_HOST" "mkdir -p $DEPLOY_PATH"
    
    # Copy deployment files
    print_status "Copying deployment files..."
    scp "$PROJECT_ROOT/docker-compose.yml" "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"
    scp "$PROJECT_ROOT/production.env.template" "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"
    scp -r "$PROJECT_ROOT/nginx" "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"
    scp -r "$PROJECT_ROOT/scripts" "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"
    
    # Create environment file
    print_status "Creating environment file..."
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $DEPLOY_PATH
        
        cat > .env << 'ENVEOF'
DATABASE_URL=mysql://${MYSQL_USER:-solar_user}:$MYSQL_PASSWORD@mysql:3306/${MYSQL_DATABASE:-solar_db}
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=${MYSQL_DATABASE:-solar_db}
MYSQL_USER=${MYSQL_USER:-solar_user}
MYSQL_PASSWORD=$MYSQL_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-15m}
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN:-7d}
NODE_ENV=production
DOCKER_REGISTRY=${DOCKER_REGISTRY:-ghcr.io}/
DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME:-solar-api}
DOCKER_TAG=${DOCKER_TAG:-latest}
COMPOSE_PROJECT_NAME=solar
ENVIRONMENT_SUFFIX=_prod
RESTART_POLICY=always
LOG_MAX_SIZE=10m
LOG_MAX_FILE=3
HTTP_PORT=80
HTTPS_PORT=443
ENVEOF
EOF
    
    # Deploy services
    print_status "Starting services..."
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Pull latest images
        docker-compose pull
        
        # Stop existing services
        docker-compose down
        
        # Start services
        docker-compose up -d
        
        # Wait for services to be ready
        sleep 30
        
        # Run database migrations
        docker-compose exec -T app npm run db:migrate
        
        # Seed production data
        docker-compose exec -T app npm run db:seed:prod
        
        # Clean up old images
        docker image prune -f
EOF
    
    print_success "Application deployed successfully."
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check service status
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $DEPLOY_PATH
        echo "Service status:"
        docker-compose ps
        
        echo -e "\nApplication logs (last 20 lines):"
        docker-compose logs --tail=20 app
EOF
    
    # Health check
    print_status "Performing health check..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://$VPS_HOST/health" >/dev/null; then
            print_success "Health check passed. Application is running."
            return 0
        fi
        
        print_status "Health check attempt $attempt/$max_attempts failed. Retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts."
    return 1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (default: production)"
    echo "  -s, --skip-tests        Skip running tests"
    echo "  -b, --skip-backup       Skip creating backup"
    echo "  -f, --force             Force deployment without confirmation"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  VPS_HOST                VPS server IP address or hostname"
    echo "  VPS_USER                VPS server username"
    echo "  MYSQL_ROOT_PASSWORD     MySQL root password"
    echo "  MYSQL_PASSWORD          MySQL user password"
    echo "  JWT_SECRET              JWT secret key"
    echo "  JWT_REFRESH_SECRET      JWT refresh secret key"
    echo ""
    echo "Example:"
    echo "  $0 --environment production --skip-tests"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment process
main() {
    print_status "Starting deployment to $ENVIRONMENT environment..."
    
    # Pre-deployment checks
    check_dependencies
    validate_environment
    test_ssh_connection
    
    # Confirmation
    if [ "$FORCE_DEPLOY" != true ]; then
        echo ""
        print_warning "This will deploy the Solar API to $VPS_HOST"
        print_warning "Environment: $ENVIRONMENT"
        echo ""
        read -p "Do you want to continue? [y/N] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    fi
    
    # Deployment steps
    create_backup
    deploy_application
    
    if verify_deployment; then
        print_success "Deployment completed successfully!"
        print_status "Application is available at: http://$VPS_HOST"
    else
        print_error "Deployment verification failed!"
        exit 1
    fi
}

# Run main function
main "$@"
