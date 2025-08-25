#!/bin/bash

# SSL Certificate Setup Script
# This script sets up SSL certificates for the Solar API

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
SSL_DIR="$PROJECT_ROOT/nginx/ssl"

# Default values
CERT_TYPE="self-signed"
DOMAIN="localhost"
EMAIL=""

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

# Function to create self-signed certificates
create_self_signed_cert() {
    print_status "Creating self-signed SSL certificate..."
    
    mkdir -p "$SSL_DIR"
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate
    openssl req -x509 -new -nodes \
        -key "$SSL_DIR/key.pem" \
        -sha256 -days 365 \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Solar API/CN=$DOMAIN"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    print_success "Self-signed SSL certificate created successfully!"
    print_warning "Note: Self-signed certificates are not trusted by browsers."
    print_warning "For production, use Let's Encrypt or purchase a certificate from a CA."
}

# Function to setup Let's Encrypt certificate
setup_letsencrypt_cert() {
    print_status "Setting up Let's Encrypt SSL certificate..."
    
    if [ -z "$EMAIL" ]; then
        print_error "Email is required for Let's Encrypt certificates."
        exit 1
    fi
    
    # Check if certbot is installed
    if ! command -v certbot >/dev/null 2>&1; then
        print_status "Installing certbot..."
        
        # Install certbot based on the OS
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update
            sudo apt-get install -y certbot
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y certbot
        elif command -v dnf >/dev/null 2>&1; then
            sudo dnf install -y certbot
        else
            print_error "Could not install certbot. Please install it manually."
            exit 1
        fi
    fi
    
    # Create certificate directory
    mkdir -p "$SSL_DIR"
    
    # Generate certificate using standalone mode
    print_status "Generating Let's Encrypt certificate for $DOMAIN..."
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN"
    
    # Copy certificates to nginx directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set proper permissions
    sudo chown $(whoami):$(whoami) "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    print_success "Let's Encrypt SSL certificate created successfully!"
    
    # Setup auto-renewal
    setup_cert_renewal
}

# Function to setup certificate auto-renewal
setup_cert_renewal() {
    print_status "Setting up certificate auto-renewal..."
    
    # Create renewal script
    cat > "$SCRIPT_DIR/renew-ssl.sh" << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script

set -e

DOMAIN="$1"
SSL_DIR="$2"
DEPLOY_PATH="/opt/solar-api"

if [ -z "$DOMAIN" ] || [ -z "$SSL_DIR" ]; then
    echo "Usage: $0 <domain> <ssl_dir>"
    exit 1
fi

# Renew certificate
certbot renew --quiet

# Copy renewed certificates
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"

# Restart nginx
if [ -d "$DEPLOY_PATH" ]; then
    cd "$DEPLOY_PATH"
    docker-compose restart nginx
fi

echo "SSL certificate renewed successfully!"
EOF
    
    chmod +x "$SCRIPT_DIR/renew-ssl.sh"
    
    # Add cron job for auto-renewal (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 */12 * * * $SCRIPT_DIR/renew-ssl.sh $DOMAIN $SSL_DIR >> /var/log/ssl-renewal.log 2>&1") | crontab -
    
    print_success "Auto-renewal setup completed!"
    print_status "Certificates will be automatically renewed twice daily."
}

# Function to validate certificate
validate_certificate() {
    print_status "Validating SSL certificate..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_error "Certificate files not found!"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in "$SSL_DIR/cert.pem" -text -noout >/dev/null 2>&1; then
        print_success "Certificate is valid!"
        
        # Show certificate info
        print_status "Certificate information:"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject|Issuer|Not Before|Not After)"
        
        return 0
    else
        print_error "Certificate is invalid!"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE         Certificate type: self-signed or letsencrypt (default: self-signed)"
    echo "  -d, --domain DOMAIN     Domain name (default: localhost)"
    echo "  -e, --email EMAIL       Email for Let's Encrypt (required for letsencrypt type)"
    echo "  -v, --validate          Validate existing certificate"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --type self-signed --domain localhost"
    echo "  $0 --type letsencrypt --domain example.com --email admin@example.com"
    echo "  $0 --validate"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            CERT_TYPE="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -v|--validate)
            validate_certificate
            exit $?
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

# Main function
main() {
    print_status "Setting up SSL certificates..."
    print_status "Certificate type: $CERT_TYPE"
    print_status "Domain: $DOMAIN"
    
    case $CERT_TYPE in
        "self-signed")
            create_self_signed_cert
            ;;
        "letsencrypt")
            setup_letsencrypt_cert
            ;;
        *)
            print_error "Invalid certificate type: $CERT_TYPE"
            print_error "Supported types: self-signed, letsencrypt"
            exit 1
            ;;
    esac
    
    validate_certificate
    
    print_success "SSL setup completed successfully!"
    print_status "Certificate files are located in: $SSL_DIR"
}

# Run main function
main "$@"
