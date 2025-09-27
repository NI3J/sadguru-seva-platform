# 🚀 Deployment Guide - Sadguru Seva Platform

This guide covers deployment strategies for the Sadguru Seva Platform across different environments.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing
- [ ] Code linting completed
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Database migrations ready

### ✅ Environment Setup
- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] CDN setup (if applicable)

## 🏠 Local Development

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd sadguru-seva-platform

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp database.env.example database.env
# Edit database.env with your local settings

# Run database migrations
mysql -u root -p < spiritual_backup.sql

# Start development server
python app.py
```

### Development Configuration
```env
# database.env for development
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=sadguru_seva_dev
SECRET_KEY=dev_secret_key_here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_dev_email
MAIL_PASSWORD=your_app_password
FAST2SMS_API_KEY=your_dev_api_key
FLASK_ENV=development
DEBUG=True
```

## 🌐 Production Deployment

### Option 1: Traditional VPS/Server

#### Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ 
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

#### Setup Steps

1. **Server Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python 3.8+
   sudo apt install python3 python3-pip python3-venv -y
   
   # Install MySQL
   sudo apt install mysql-server -y
   
   # Install Nginx
   sudo apt install nginx -y
   
   # Install Git
   sudo apt install git -y
   ```

2. **Application Setup**
   ```bash
   # Create application user
   sudo useradd -m -s /bin/bash sadguru
   sudo su - sadguru
   
   # Clone repository
   git clone <repository-url> sadguru-seva-platform
   cd sadguru-seva-platform
   
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Database Configuration**
   ```bash
   # Create database
   sudo mysql -u root -p
   CREATE DATABASE sadguru_seva_prod;
   CREATE USER 'sadguru_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON sadguru_seva_prod.* TO 'sadguru_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   
   # Import database schema
   mysql -u sadguru_user -p sadguru_seva_prod < spiritual_backup.sql
   ```

4. **Environment Configuration**
   ```bash
   # Create production environment file
   cat > database.env << EOF
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=sadguru_user
   MYSQL_PASSWORD=secure_password
   MYSQL_DB=sadguru_seva_prod
   SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_production_email
   MAIL_PASSWORD=your_app_password
   FAST2SMS_API_KEY=your_production_api_key
   FLASK_ENV=production
   DEBUG=False
   EOF
   ```

5. **Systemd Service**
   ```bash
   # Create systemd service file
   sudo tee /etc/systemd/system/sadguru-seva.service > /dev/null << EOF
   [Unit]
   Description=Sadguru Seva Platform
   After=network.target

   [Service]
   User=sadguru
   Group=sadguru
   WorkingDirectory=/home/sadguru/sadguru-seva-platform
   Environment=PATH=/home/sadguru/sadguru-seva-platform/venv/bin
   ExecStart=/home/sadguru/sadguru-seva-platform/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   EOF
   
   # Enable and start service
   sudo systemctl daemon-reload
   sudo systemctl enable sadguru-seva
   sudo systemctl start sadguru-seva
   ```

6. **Nginx Configuration**
   ```bash
   # Create Nginx configuration
   sudo tee /etc/nginx/sites-available/sadguru-seva > /dev/null << EOF
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto \$scheme;
       }
       
       location /static {
           alias /home/sadguru/sadguru-seva-platform/static;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   EOF
   
   # Enable site
   sudo ln -s /etc/nginx/sites-available/sadguru-seva /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **SSL Certificate (Let's Encrypt)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Obtain SSL certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   
   # Test auto-renewal
   sudo certbot renew --dry-run
   ```

### Option 2: Railway Deployment

Railway provides a simple deployment platform with built-in database and monitoring.

#### Setup Steps

1. **Railway Account Setup**
   - Create account at [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Environment Variables**
   Set the following in Railway dashboard:
   ```
   MYSQL_HOST=metro.proxy.rlwy.net
   MYSQL_PORT=52774
   MYSQL_USER=root
   MYSQL_PASSWORD=your_railway_password
   MYSQL_DB=railway
   SECRET_KEY=your_secret_key
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_email
   MAIL_PASSWORD=your_app_password
   FAST2SMS_API_KEY=your_api_key
   FLASK_ENV=production
   ```

3. **Deploy**
   - Railway will automatically detect the `Procfile`
   - Deploy happens automatically on git push
   - Custom domain can be configured in Railway dashboard

### Option 3: Docker Deployment

#### Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 sadguru && chown -R sadguru:sadguru /app
USER sadguru

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MYSQL_HOST=db
      - MYSQL_PORT=3306
      - MYSQL_USER=sadguru
      - MYSQL_PASSWORD=secure_password
      - MYSQL_DB=sadguru_seva
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=sadguru_seva
      - MYSQL_USER=sadguru
      - MYSQL_PASSWORD=secure_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./spiritual_backup.sql:/docker-entrypoint-initdb.d/init.sql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web

volumes:
  mysql_data:
```

## 🔧 Configuration Management

### Environment-Specific Settings

#### Development
```python
# config.py
class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False
```

#### Production
```python
# config.py
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
```

### Database Configuration
- Use connection pooling for production
- Configure read replicas for high traffic
- Set up database backups
- Monitor database performance

### Security Configuration
- Enable HTTPS in production
- Configure secure headers
- Set up rate limiting
- Enable logging and monitoring

## 📊 Monitoring & Maintenance

### Health Checks
- Application health: `/health`
- Database connectivity
- External service availability
- Performance metrics

### Logging
- Application logs: `logs/sadguru_seva.log`
- Error logs: `logs/error.log`
- Access logs: Nginx logs
- Database logs: MySQL logs

### Backup Strategy
```bash
# Database backup
mysqldump -u root -p sadguru_seva_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/sadguru/sadguru-seva-platform

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p sadguru_seva_prod > /backups/db_$DATE.sql
tar -czf /backups/app_$DATE.tar.gz /home/sadguru/sadguru-seva-platform
find /backups -name "*.sql" -mtime +7 -delete
find /backups -name "*.tar.gz" -mtime +7 -delete
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials
   - Verify database server is running
   - Check network connectivity

2. **Permission Errors**
   - Verify file permissions
   - Check user ownership
   - Ensure proper SELinux/AppArmor settings

3. **Memory Issues**
   - Monitor memory usage
   - Optimize database queries
   - Configure swap if needed

4. **SSL Certificate Issues**
   - Verify certificate validity
   - Check certificate chain
   - Ensure proper Nginx configuration

### Debug Mode
```bash
# Enable debug mode for troubleshooting
export FLASK_ENV=development
export DEBUG=True
python app.py
```

## 📈 Performance Optimization

### Application Level
- Enable gzip compression
- Implement caching (Redis)
- Optimize database queries
- Use CDN for static assets

### Infrastructure Level
- Use load balancers
- Implement horizontal scaling
- Use database read replicas
- Monitor and optimize resources

---

**🕉️ May your deployment be smooth and your service be blessed! 🙏**