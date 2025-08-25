#!/bin/bash

# SSL Certificate Setup Script for Solar BE
# This script sets up SSL certificates using Let's Encrypt (Certbot)

set -e

# Configuration
DOMAIN="${1:-localhost}"
EMAIL="${2:-admin@example.com}"
NGINX_SSL_DIR="nginx/ssl"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/solar-api}"

echo "🔐 Setting up SSL certificates for domain: $DOMAIN"

# Check if domain is provided
if [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "" ]; then
    echo "⚠️  No domain provided, generating self-signed certificate for development..."
    setup_self_signed
    exit 0
fi

# Function to setup self-signed certificate (development)
setup_self_signed() {
    echo "📋 Generating self-signed SSL certificate..."
    
    mkdir -p "$NGINX_SSL_DIR"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$NGINX_SSL_DIR/key.pem" \
        -out "$NGINX_SSL_DIR/cert.pem" \
        -subj "/C=US/ST=Development/L=Local/O=Solar API/CN=$DOMAIN"
    
    chmod 600 "$NGINX_SSL_DIR/key.pem"
    chmod 644 "$NGINX_SSL_DIR/cert.pem"
    
    echo "✅ Self-signed SSL certificate generated successfully"
    echo "⚠️  Note: This is a self-signed certificate. Browsers will show security warnings."
}

# Function to setup Let's Encrypt certificate (production)
setup_letsencrypt() {
    echo "📋 Setting up Let's Encrypt SSL certificate..."
    
    # Install certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        echo "Installing Certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Stop nginx temporarily for certificate generation
    echo "Stopping nginx for certificate generation..."
    cd "$DEPLOY_PATH"
    docker-compose stop nginx || true
    
    # Generate certificate
    echo "Generating Let's Encrypt certificate for $DOMAIN..."
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN"
    
    # Copy certificates to nginx directory
    echo "Copying certificates to nginx directory..."
    mkdir -p "$NGINX_SSL_DIR"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$NGINX_SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$NGINX_SSL_DIR/key.pem"
    sudo chown $(whoami):$(whoami) "$NGINX_SSL_DIR"/*.pem
    chmod 644 "$NGINX_SSL_DIR/cert.pem"
    chmod 600 "$NGINX_SSL_DIR/key.pem"
    
    # Setup automatic renewal
    echo "Setting up automatic certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'cd $DEPLOY_PATH && docker-compose restart nginx'") | crontab -
    
    echo "✅ Let's Encrypt SSL certificate setup completed"
    echo "📅 Automatic renewal configured (daily at 12:00 PM)"
}

# Main execution
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "" ]; then
    setup_letsencrypt
else
    setup_self_signed
fi

echo ""
echo "🎉 SSL setup completed!"
echo "📁 Certificates location: $NGINX_SSL_DIR/"
echo "🔗 Your site will be available at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point $DOMAIN to this server"
echo "2. Run 'docker-compose restart nginx' to apply certificates"
echo "3. Test your HTTPS connection"