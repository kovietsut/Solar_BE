# 🔒 Security Guidelines for Solar API

This document outlines security best practices and configurations for the Solar API deployment.

## 🛡️ Security Overview

The Solar API implements multiple layers of security:

### Application Layer

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Password hashing with bcrypt
- Security headers implementation

### Infrastructure Layer

- Nginx reverse proxy with rate limiting
- SSL/TLS encryption
- Container security
- Network isolation
- Firewall configuration

### Operational Layer

- Environment variable security
- SSH key-based authentication
- Regular security updates
- Backup encryption
- Log monitoring

## 🔐 Environment Variables Security

### Critical Variables

These variables contain sensitive information and must be secured:

```env
# Database Credentials
MYSQL_ROOT_PASSWORD=    # Database root password
MYSQL_PASSWORD=        # Application database password

# JWT Secrets
JWT_SECRET=           # Primary JWT signing key
JWT_REFRESH_SECRET=   # Refresh token signing key

# Infrastructure
VPS_SSH_PRIVATE_KEY=  # SSH private key for deployment
```

### Security Requirements

1. **Minimum Length**: 64 characters for JWT secrets
2. **Character Set**: Include uppercase, lowercase, numbers, and symbols
3. **Uniqueness**: Different secrets for each environment
4. **Rotation**: Regular rotation schedule (quarterly recommended)

### Generation Examples

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Generate secure password
openssl rand -base64 32

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "deployment@your-domain.com"
```

## 🌐 Network Security

### Firewall Configuration

**Allowed Ports**:

- 22 (SSH) - Restricted to specific IPs
- 80 (HTTP) - Redirects to HTTPS
- 443 (HTTPS) - Public access

**Blocked by Default**:

- All other ports
- Direct database access (3306)
- Internal application port (3000)

### Rate Limiting

Nginx implements rate limiting:

- API endpoints: 10 requests/second
- Authentication endpoints: 5 requests/minute
- Burst allowance with nodelay

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

## 🔑 Authentication & Authorization

### JWT Token Security

**Access Tokens**:

- Short expiration (15 minutes)
- Stateless validation
- Secure HTTP-only cookies (recommended)

**Refresh Tokens**:

- Longer expiration (7 days)
- Database stored for revocation
- Single-use tokens

**Security Headers**:

```javascript
{
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'"
}
```

### Role-Based Access Control

**Role Hierarchy**:

1. Super Admin - Full system access
2. Admin - Administrative functions
3. User - Standard user operations

**Permission Model**:

- Granular permissions per resource
- Principle of least privilege
- Regular permission audits

## 🐳 Container Security

### Docker Security Practices

1. **Non-root User**: Application runs as `nestjs` user (UID 1001)
2. **Minimal Base Image**: Alpine Linux for smaller attack surface
3. **Multi-stage Build**: Reduces final image size
4. **Read-only Filesystem**: Where possible
5. **Security Scanning**: Trivy scanner in CI/CD

### Container Configuration

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Set ownership and permissions
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

## 🔐 SSL/TLS Configuration

### Certificate Management

**Production**: Use Let's Encrypt or commercial CA
**Development**: Self-signed certificates acceptable

### TLS Configuration

```nginx
# TLS versions
ssl_protocols TLSv1.2 TLSv1.3;

# Cipher suites (strong encryption only)
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Certificate Monitoring

- Automated renewal with certbot
- Expiration monitoring
- Certificate transparency logging

## 🗄️ Database Security

### MySQL Configuration

```sql
-- Create dedicated application user
CREATE USER 'solar_user'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON solar_db.* TO 'solar_user'@'%';
FLUSH PRIVILEGES;
```

### Connection Security

- TLS encryption for database connections
- Connection pooling with limits
- Prepared statements (Prisma ORM)
- Input sanitization

### Backup Security

- Encrypted backups
- Secure backup storage
- Regular backup testing
- Retention policies

## 📊 Monitoring & Logging

### Security Monitoring

**Log Sources**:

- Application logs (authentication, authorization)
- Nginx access/error logs
- System logs (auth.log, syslog)
- Docker container logs

**Key Events to Monitor**:

- Failed login attempts
- Privilege escalation attempts
- Unusual API usage patterns
- SSL/TLS handshake failures
- Database connection errors

### Alerting

Set up alerts for:

- Multiple failed authentication attempts
- Unusual traffic patterns
- SSL certificate expiration
- System resource exhaustion
- Security scan results

## 🚨 Incident Response

### Security Incident Checklist

1. **Immediate Response**:

   - [ ] Isolate affected systems
   - [ ] Change compromised credentials
   - [ ] Review access logs
   - [ ] Document incident details

2. **Investigation**:

   - [ ] Identify attack vector
   - [ ] Assess data exposure
   - [ ] Check backup integrity
   - [ ] Review security controls

3. **Recovery**:

   - [ ] Patch vulnerabilities
   - [ ] Restore from clean backups
   - [ ] Update security configurations
   - [ ] Monitor for reoccurrence

4. **Post-Incident**:
   - [ ] Update security procedures
   - [ ] Conduct team training
   - [ ] Implement additional controls
   - [ ] Document lessons learned

## 🔄 Security Maintenance

### Regular Tasks

**Daily**:

- Monitor security alerts
- Review authentication logs
- Check SSL certificate status

**Weekly**:

- Security scan reports
- Access log analysis
- Backup verification

**Monthly**:

- Security patch updates
- Permission audits
- Vulnerability assessments
- Credential rotation review

**Quarterly**:

- Full security review
- Penetration testing
- Disaster recovery testing
- Security training updates

### Security Updates

**System Updates**:

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

**Container Updates**:

```bash
# Update base images
docker-compose pull
docker-compose up -d

# Clean old images
docker image prune -f
```

**Dependency Updates**:

```bash
# Check for security vulnerabilities
npm audit

# Update packages
npm update
```

## 📋 Security Checklist

### Deployment Security

- [ ] All secrets properly configured
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules implemented
- [ ] Database access restricted
- [ ] Non-root containers
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Backup encryption active
- [ ] Monitoring configured
- [ ] Incident response plan ready

### Ongoing Security

- [ ] Regular security updates
- [ ] Log monitoring active
- [ ] Backup testing performed
- [ ] Access reviews conducted
- [ ] Vulnerability scans running
- [ ] Documentation updated
- [ ] Team training current
- [ ] Compliance requirements met

## 📞 Security Contacts

- **Security Issues**: security@your-domain.com
- **Incident Response**: incident@your-domain.com
- **General Questions**: support@your-domain.com

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure deployment.
