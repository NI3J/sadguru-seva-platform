# 🌸 Sadguru Seva Platform

A comprehensive spiritual web application built with Flask, designed to serve the spiritual community with various devotional services and features.

## 🚀 Features

### Core Functionality
- **Bhaktgan Registration**: Devotee registration and management system
- **Hari Jap Sadhana**: Voice recognition-based mantra counting
- **Japa Sadhana**: Advanced mantra repetition tracking
- **Daily Programs**: Spiritual program scheduling and management
- **Wisdom Archive**: Spiritual content and teachings
- **Krishna Lila**: Interactive spiritual stories
- **Contact System**: Communication and feedback system

### Technical Features
- **Multi-language Support**: Marathi and Hindi interface
- **Voice Recognition**: Speech-to-text for mantra counting
- **Responsive Design**: Mobile-first approach
- **Security**: Input validation, rate limiting, secure sessions
- **Database**: MySQL with connection pooling
- **Email Integration**: Automated email notifications
- **SMS Integration**: OTP verification via Fast2SMS

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- MySQL 5.7+
- Node.js (for frontend assets)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sadguru-seva-platform
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create `database.env` file:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DB=sadguru_seva
   SECRET_KEY=your_secret_key
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_email
   MAIL_PASSWORD=your_app_password
   FAST2SMS_API_KEY=your_api_key
   ```

5. **Database Setup**
   ```bash
   mysql -u root -p < spiritual_backup.sql
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

## 📁 Project Structure

```
sadguru-seva-platform/
├── app.py                          # Main application entry point
├── config.py                       # Configuration management
├── db_config.py                    # Database configuration
├── requirements.txt                # Python dependencies
├── Procfile                        # Production deployment config
├── routes/                         # Route handlers
│   ├── main.py                    # Main routes
│   ├── auth.py                    # Authentication routes
│   ├── japa.py                    # Japa sadhana routes
│   ├── harijap_auth.py           # Hari jap authentication
│   ├── wisdom.py                  # Wisdom content routes
│   ├── programs.py                # Program management
│   └── utils.py                   # Utility functions
├── templates/                      # HTML templates
│   ├── base.html                  # Base template
│   ├── index.html                 # Home page
│   ├── bhaktgan.html              # Registration page
│   ├── harijap.html               # Hari jap interface
│   ├── japa.html                  # Japa interface
│   └── errors/                     # Error pages
├── static/                         # Static assets
│   ├── css/                       # Stylesheets
│   ├── js/                        # JavaScript files
│   ├── images/                    # Image assets
│   └── audio/                     # Audio files
├── utils/                          # Utility modules
│   ├── logger.py                  # Logging system
│   ├── validators.py              # Input validation
│   ├── security.py                # Security utilities
│   └── error_handlers.py          # Error handling
├── middleware/                     # Middleware components
│   └── auth_middleware.py         # Authentication middleware
└── logs/                          # Application logs
```

## 🔧 Configuration

### Database Configuration
The application uses MySQL with PyMySQL connector. Database configuration is managed through environment variables in `database.env`.

### Security Configuration
- Session management with secure cookies
- Input validation and sanitization
- Rate limiting for API endpoints
- CSRF protection
- SQL injection prevention

### Email Configuration
- SMTP configuration for Gmail
- Automated welcome emails
- Contact form auto-replies
- Email templates in Marathi/Hindi

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**
   Set production environment variables:
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=your_production_secret_key
   ```

2. **Database Migration**
   ```bash
   mysql -u root -p < railway_local_dump.sql
   ```

3. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

### Railway Deployment
The application is configured for Railway deployment with:
- `Procfile` for process management
- Environment variable configuration
- Database connection pooling

## 📊 Monitoring & Logging

### Logging System
- Structured JSON logging
- Log rotation (10MB files, 5 backups)
- Performance metrics logging
- Security event logging
- User activity tracking

### Health Monitoring
- `/health` endpoint for health checks
- Database connection monitoring
- Error rate tracking
- Performance metrics

## 🔒 Security Features

### Input Validation
- Email format validation
- Phone number validation (Indian format)
- Name validation (English + Devanagari)
- Message content sanitization
- SQL injection prevention

### Rate Limiting
- API endpoint rate limiting
- Form submission rate limiting
- IP-based rate limiting
- Configurable limits per endpoint

### Session Security
- Secure session cookies
- Session timeout management
- IP address validation
- User agent tracking

## 🧪 Testing

### Running Tests
```bash
pytest tests/
```

### Test Coverage
```bash
pytest --cov=app tests/
```

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Mobile-optimized voice recognition
- Responsive design patterns
- Progressive Web App features

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spiritual community for feedback and suggestions
- Open source contributors
- Flask and Python community

## 📞 Support

For support and questions:
- Email: pratikshasuryawanshi1994@gmail.com
- Create an issue in the repository

---

**🕉️ May this platform serve the spiritual community with devotion and excellence. 🙏**