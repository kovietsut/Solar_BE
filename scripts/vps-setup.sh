#!/bin/bash

# VPS Server Setup Script for Solar API
# This script prepares a VPS server for Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
    
    print_status "Detected OS: $OS $VERSION"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    
    case $OS in
        "ubuntu"|"debian")
            sudo apt-get update
            sudo apt-get upgrade -y
            ;;
        "centos"|"rhel"|"fedora")
            if command -v dnf >/dev/null 2>&1; then
                sudo dnf update -y
            else
                sudo yum update -y
            fi
            ;;
        *)
            print_warning "Unsupported OS for automatic updates. Please update manually."
            ;;
    esac
    
    print_success "System packages updated."
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Check if Docker is already installed
    if command -v docker >/dev/null 2>&1; then
        print_warning "Docker is already installed."
        docker --version
        return
    fi
    
    case $OS in
        "ubuntu"|"debian")
            # Install prerequisites
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Set up stable repository
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
            ;;
        "centos"|"rhel")
            # Install prerequisites
            sudo yum install -y yum-utils
            
            # Add Docker repository
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # Install Docker Engine
            sudo yum install -y docker-ce docker-ce-cli containerd.io
            ;;
        "fedora")
            # Install prerequisites
            sudo dnf install -y dnf-plugins-core
            
            # Add Docker repository
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            
            # Install Docker Engine
            sudo dnf install -y docker-ce docker-ce-cli containerd.io
            ;;
        *)
            print_error "Unsupported OS for Docker installation: $OS"
            exit 1
            ;;
    esac
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully!"
    print_warning "Please log out and log back in to use Docker without sudo."
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Check if Docker Compose is already installed
    if command -v docker-compose >/dev/null 2>&1; then
        print_warning "Docker Compose is already installed."
        docker-compose --version
        return
    fi
    
    # Get latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully!"
    docker-compose --version
}

# Function to install essential tools
install_essential_tools() {
    print_status "Installing essential tools..."
    
    case $OS in
        "ubuntu"|"debian")
            sudo apt-get install -y \
                curl \
                wget \
                git \
                unzip \
                htop \
                nano \
                vim \
                ufw \
                fail2ban \
                logrotate
            ;;
        "centos"|"rhel"|"fedora")
            if command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y \
                    curl \
                    wget \
                    git \
                    unzip \
                    htop \
                    nano \
                    vim \
                    firewalld \
                    fail2ban \
                    logrotate
            else
                sudo yum install -y \
                    curl \
                    wget \
                    git \
                    unzip \
                    htop \
                    nano \
                    vim \
                    firewalld \
                    fail2ban \
                    logrotate
            fi
            ;;
    esac
    
    print_success "Essential tools installed."
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    case $OS in
        "ubuntu"|"debian")
            # Configure UFW
            sudo ufw default deny incoming
            sudo ufw default allow outgoing
            
            # Allow SSH
            sudo ufw allow ssh
            
            # Allow HTTP and HTTPS
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            
            # Enable firewall
            sudo ufw --force enable
            
            print_success "UFW firewall configured and enabled."
            ;;
        "centos"|"rhel"|"fedora")
            # Configure firewalld
            sudo systemctl start firewalld
            sudo systemctl enable firewalld
            
            # Allow SSH
            sudo firewall-cmd --permanent --add-service=ssh
            
            # Allow HTTP and HTTPS
            sudo firewall-cmd --permanent --add-service=http
            sudo firewall-cmd --permanent --add-service=https
            
            # Reload firewall
            sudo firewall-cmd --reload
            
            print_success "Firewalld configured and enabled."
            ;;
    esac
}

# Function to configure security
configure_security() {
    print_status "Configuring security settings..."
    
    # Configure fail2ban
    if command -v fail2ban-server >/dev/null 2>&1; then
        sudo systemctl start fail2ban
        sudo systemctl enable fail2ban
        print_success "Fail2ban enabled."
    fi
    
    # Set up automatic security updates (Ubuntu/Debian)
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo apt-get install -y unattended-upgrades
        
        cat << 'EOF' | sudo tee /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
        
        print_success "Automatic security updates configured."
    fi
}

# Function to create deployment user
create_deployment_user() {
    local username=${1:-deploy}
    
    print_status "Creating deployment user: $username"
    
    # Check if user already exists
    if id "$username" &>/dev/null; then
        print_warning "User $username already exists."
        return
    fi
    
    # Create user
    sudo useradd -m -s /bin/bash "$username"
    
    # Add to docker group
    sudo usermod -aG docker "$username"
    
    # Create .ssh directory
    sudo mkdir -p "/home/$username/.ssh"
    sudo chmod 700 "/home/$username/.ssh"
    sudo chown "$username:$username" "/home/$username/.ssh"
    
    print_success "Deployment user $username created."
    print_status "Don't forget to add SSH public keys to /home/$username/.ssh/authorized_keys"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation for Docker..."
    
    # Configure Docker log rotation
    sudo mkdir -p /etc/docker
    cat << 'EOF' | sudo tee /etc/docker/daemon.json
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    
    # Restart Docker to apply changes
    sudo systemctl restart docker
    
    print_success "Docker log rotation configured."
}

# Function to create deployment directories
create_deployment_directories() {
    print_status "Creating deployment directories..."
    
    local deploy_path="/opt/solar-api"
    
    sudo mkdir -p "$deploy_path"
    sudo mkdir -p "$deploy_path/backups"
    sudo mkdir -p "$deploy_path/logs"
    sudo mkdir -p "$deploy_path/uploads"
    
    # Set proper permissions
    sudo chown -R deploy:deploy "$deploy_path"
    sudo chmod -R 755 "$deploy_path"
    
    print_success "Deployment directories created at $deploy_path"
}

# Function to show server information
show_server_info() {
    print_status "Server Information:"
    echo "=================="
    echo "OS: $OS $VERSION"
    echo "Kernel: $(uname -r)"
    echo "Memory: $(free -h | awk 'NR==2{printf "%.1fG/%.1fG (%.1f%%)\n", $3/1024/1024,$2/1024/1024,$3*100/$2}')"
    echo "Disk: $(df -h / | awk 'NR==2{printf "%s/%s (%s)\n", $3,$2,$5}')"
    echo "CPU: $(nproc) cores"
    echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
    echo "Docker Compose: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
    echo "=================="
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --user USERNAME     Create deployment user (default: deploy)"
    echo "  -s, --skip-security     Skip security configuration"
    echo "  -f, --skip-firewall     Skip firewall configuration"
    echo "  -i, --info              Show server information only"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Update system packages"
    echo "  2. Install Docker and Docker Compose"
    echo "  3. Install essential tools"
    echo "  4. Configure firewall"
    echo "  5. Configure security settings"
    echo "  6. Create deployment user"
    echo "  7. Setup log rotation"
    echo "  8. Create deployment directories"
}

# Default values
DEPLOYMENT_USER="deploy"
SKIP_SECURITY=false
SKIP_FIREWALL=false
INFO_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--user)
            DEPLOYMENT_USER="$2"
            shift 2
            ;;
        -s|--skip-security)
            SKIP_SECURITY=true
            shift
            ;;
        -f|--skip-firewall)
            SKIP_FIREWALL=true
            shift
            ;;
        -i|--info)
            INFO_ONLY=true
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

# Main function
main() {
    print_status "Starting VPS setup for Solar API..."
    
    detect_os
    
    if [ "$INFO_ONLY" = true ]; then
        show_server_info
        exit 0
    fi
    
    # Confirm before proceeding
    echo ""
    print_warning "This script will configure your VPS server for Docker deployment."
    print_warning "It will install Docker, configure firewall, and create a deployment user."
    echo ""
    read -p "Do you want to continue? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled."
        exit 0
    fi
    
    # Run setup steps
    update_system
    install_essential_tools
    install_docker
    install_docker_compose
    
    if [ "$SKIP_FIREWALL" != true ]; then
        configure_firewall
    fi
    
    if [ "$SKIP_SECURITY" != true ]; then
        configure_security
    fi
    
    create_deployment_user "$DEPLOYMENT_USER"
    setup_log_rotation
    create_deployment_directories
    
    show_server_info
    
    print_success "VPS setup completed successfully!"
    print_warning "Please log out and log back in to use Docker without sudo."
    print_status "Next steps:"
    echo "  1. Add your SSH public key to /home/$DEPLOYMENT_USER/.ssh/authorized_keys"
    echo "  2. Configure your GitHub Actions secrets"
    echo "  3. Run your deployment pipeline"
    echo ""
    print_status "For local development, ensure you have Node.js 24+ installed"
}

# Run main function
main "$@"
