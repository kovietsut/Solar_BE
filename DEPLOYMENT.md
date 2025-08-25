# 🚀 Solar API Deployment Guide

This guide walks you through setting up a complete CI/CD pipeline for the Solar API with Docker containerization and VPS deployment.

## 📋 Prerequisites

### Local Development

- Node.js 24+
- Docker & Docker Compose
- Git

### VPS Server

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 2GB+ RAM
- 20GB+ disk space
- SSH access with sudo privileges

### GitHub Repository

- GitHub account with repository access
- GitHub Actions enabled

## 🔧 Step-by-Step Setup

### 1. Repository Setup

1. **Clone and configure your repository**:

```bash
git clone https://github.com/your-username/solar-api.git
cd solar-api
```

2. **Install dependencies**:

```bash
npm install
```

3. **Setup environment variables**:

```bash
cp env.template .env
# Edit .env with your local development values
```

### 2. VPS Server Preparation

1. **Connect to your VPS**:

```bash
ssh root@your-server-ip
```

2. **Run the automated setup script**:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/solar-api/main/scripts/vps-setup.sh -o vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh --user deploy
```

This script will:

- Update system packages
- Install Docker and Docker Compose
- Configure firewall (ports 80, 443, 22)
- Create deployment user
- Setup security configurations

3. **Setup SSL certificates**:

For development (self-signed):

```bash
./scripts/setup-ssl.sh --type self-signed --domain your-domain.com
```

For production (Let's Encrypt):

```bash
./scripts/setup-ssl.sh --type letsencrypt --domain your-domain.com --email admin@your-domain.com
```

### 3. GitHub Secrets Configuration

Go to your GitHub repository: `Settings > Secrets and variables > Actions`

Add these **Repository Secrets**:

#### Server Configuration

```
VPS_HOST=your.server.ip.address
VPS_USER=deploy
VPS_SSH_PRIVATE_KEY=your_private_ssh_key_content
DEPLOY_PATH=/opt/solar-api
```

#### Database Configuration

```
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=solar_db
MYSQL_USER=solar_user
MYSQL_PASSWORD=your_secure_user_password_here
```

#### JWT Configuration

```
JWT_SECRET=your_super_secret_jwt_key_minimum_64_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_64_characters_long
JWT_REFRESH_EXPIRES_IN=7d
```

#### Optional Notifications

```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. SSH Key Setup

1. **Generate SSH key pair** (if you don't have one):

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com"
```

2. **Add public key to VPS**:

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@your-server-ip
```

3. **Add private key to GitHub Secrets**:

```bash
cat ~/.ssh/id_rsa
# Copy the entire content including -----BEGIN/END----- lines
# Paste into GitHub Secret: VPS_SSH_PRIVATE_KEY
```

### 5. Domain Configuration (Optional)

1. **Point your domain to VPS**:

   - Create an A record pointing to your VPS IP
   - Wait for DNS propagation (up to 24 hours)

2. **Update Nginx configuration**:

```bash
# On your VPS, edit nginx/conf.d/default.conf
server_name your-domain.com www.your-domain.com;
```

### 6. First Deployment

1. **Test the pipeline**:

   - Push code to `main` branch
   - Check GitHub Actions tab for pipeline status
   - Monitor deployment logs

2. **Verify deployment**:

```bash
# Check services are running
ssh deploy@your-server-ip
cd /opt/solar-api
docker-compose ps

# Test API endpoints
curl http://your-server-ip/health
curl https://your-domain.com/api
```

## 🔍 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

```bash
# Test SSH connection
ssh -v deploy@your-server-ip

# Check SSH key format
cat ~/.ssh/id_rsa | head -1
# Should start with: -----BEGIN OPENSSH PRIVATE KEY-----
```

#### 2. Docker Build Failed

```bash
# Check Docker daemon status
sudo systemctl status docker

# Check disk space
df -h

# Clean up Docker
docker system prune -f
```

#### 3. Database Connection Failed

```bash
# Check MySQL container
docker-compose logs mysql

# Test database connection
docker-compose exec mysql mysql -u root -p
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443
```

### Debugging Commands

```bash
# View application logs
docker-compose logs -f app

# View all services status
docker-compose ps

# Check nginx configuration
docker-compose exec nginx nginx -t

# Monitor resource usage
docker stats

# Check firewall status
sudo ufw status  # Ubuntu/Debian
sudo firewall-cmd --list-all  # CentOS/RHEL
```

## 📊 Monitoring & Maintenance

### Health Checks

- Application: `http://your-server/health`
- Database: Check via application logs
- SSL: Use online SSL checkers

### Regular Maintenance

#### Weekly

- Check application logs for errors
- Monitor disk space usage
- Review security logs

#### Monthly

- Update system packages
- Review backup retention
- Check SSL certificate expiry
- Update dependencies

### Backup Strategy

Automated backups are created before each deployment. Manual backup:

```bash
# Database backup
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > backup_$(date +%Y%m%d).sql

# Application data backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /opt/solar-api
```

## 🚨 Security Checklist

- [ ] Strong passwords for all accounts
- [ ] SSH key-based authentication only
- [ ] Firewall properly configured
- [ ] SSL/TLS certificates valid
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] Environment variables secured
- [ ] Backup encryption enabled

## 📞 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check server logs via SSH
4. Create an issue in the repository

## 🔄 Rollback Procedure

If deployment fails:

1. **Automatic rollback** (GitHub Actions will attempt)
2. **Manual rollback**:

```bash
ssh deploy@your-server-ip
cd /opt/solar-api

# Stop current services
docker-compose down

# Restore from backup
cp backups/backup_YYYYMMDD_HHMMSS/docker-compose.yml .
cp backups/backup_YYYYMMDD_HHMMSS/.env .

# Start services
docker-compose up -d

# Restore database if needed
docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < backups/backup_YYYYMMDD_HHMMSS/database.sql
```

---

**Next Steps**: After successful deployment, consider setting up monitoring tools like Grafana, Prometheus, or application monitoring services for production environments.
