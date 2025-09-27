#!/usr/bin/env python3
"""
🔧 Apply All Improvements to Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def create_directories():
    """Create necessary directories"""
    directories = [
        'logs',
        'utils',
        'templates/errors',
        'tests',
        'backups'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def backup_existing_files():
    """Backup existing files before modifications"""
    backup_dir = Path('backups')
    backup_dir.mkdir(exist_ok=True)
    
    files_to_backup = [
        'app.py',
        'db_config.py',
        'requirements.txt',
        'routes/main.py',
        'static/js/harijap.js',
        'templates/harijap.html'
    ]
    
    for file_path in files_to_backup:
        if Path(file_path).exists():
            backup_path = backup_dir / f"{file_path.replace('/', '_')}.backup"
            shutil.copy2(file_path, backup_path)
            print(f"✅ Backed up: {file_path} -> {backup_path}")

def install_dependencies():
    """Install new dependencies"""
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def create_gitignore():
    """Create comprehensive .gitignore"""
    gitignore_content = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# Environment Variables
.env
database.env
*.env

# Logs
logs/
*.log

# Database
*.db
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Application specific
uploads/
temp/
cache/
backups/

# Security
*.pem
*.key
*.crt

# Testing
.coverage
.pytest_cache/
htmlcov/

# Documentation
docs/_build/
"""
    
    with open('.gitignore', 'w') as f:
        f.write(gitignore_content.strip())
    print("✅ Created .gitignore")

def create_environment_template():
    """Create environment template"""
    env_template = """
# 🌸 Sadguru Seva Platform - Environment Configuration
# Copy this file to database.env and update with your values

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DB=sadguru_seva

# Security
SECRET_KEY=your_secret_key_here
FLASK_SECRET_KEY=your_flask_secret_key

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com

# SMS Configuration
FAST2SMS_API_KEY=your_fast2sms_api_key

# Application Configuration
FLASK_ENV=development
DEBUG=True
SESSION_COOKIE_SECURE=False
"""
    
    with open('database.env.example', 'w') as f:
        f.write(env_template.strip())
    print("✅ Created database.env.example")

def create_test_structure():
    """Create basic test structure"""
    test_init = """
# Test package initialization
"""
    
    test_basic = """
import pytest
from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
"""
    
    Path('tests').mkdir(exist_ok=True)
    
    with open('tests/__init__.py', 'w') as f:
        f.write(test_init.strip())
    
    with open('tests/test_basic.py', 'w') as f:
        f.write(test_basic.strip())
    
    print("✅ Created test structure")

def create_development_script():
    """Create development helper script"""
    dev_script = """#!/bin/bash
# Development helper script

echo "🌸 Starting Sadguru Seva Platform Development Environment"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if database.env exists
if [ ! -f "database.env" ]; then
    echo "⚠️  database.env not found. Please copy database.env.example to database.env and configure it."
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start development server
echo "Starting development server..."
python app.py
"""
    
    with open('dev.sh', 'w') as f:
        f.write(dev_script.strip())
    
    # Make executable
    os.chmod('dev.sh', 0o755)
    print("✅ Created development script (dev.sh)")

def create_production_script():
    """Create production deployment script"""
    prod_script = """#!/bin/bash
# Production deployment script

echo "🚀 Deploying Sadguru Seva Platform to Production"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Do not run this script as root"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install production dependencies
echo "Installing production dependencies..."
pip install -r requirements.txt

# Check environment configuration
if [ ! -f "database.env" ]; then
    echo "❌ database.env not found. Please configure it."
    exit 1
fi

# Create necessary directories
mkdir -p logs backups

# Set production environment
export FLASK_ENV=production
export DEBUG=False

# Start with Gunicorn
echo "Starting production server with Gunicorn..."
gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile logs/access.log --error-logfile logs/error.log app:app
"""
    
    with open('prod.sh', 'w') as f:
        f.write(prod_script.strip())
    
    # Make executable
    os.chmod('prod.sh', 0o755)
    print("✅ Created production script (prod.sh)")

def main():
    """Main improvement application function"""
    print("🌸 Applying improvements to Sadguru Seva Platform...")
    print("=" * 60)
    
    # Create directories
    create_directories()
    
    # Backup existing files
    backup_existing_files()
    
    # Create configuration files
    create_gitignore()
    create_environment_template()
    
    # Create test structure
    create_test_structure()
    
    # Create helper scripts
    create_development_script()
    create_production_script()
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies. Please check requirements.txt")
        return False
    
    print("=" * 60)
    print("✅ All improvements applied successfully!")
    print("\n📋 Next steps:")
    print("1. Copy database.env.example to database.env and configure it")
    print("2. Run './dev.sh' to start development server")
    print("3. Test the application at http://localhost:5000")
    print("4. Check logs/ directory for application logs")
    print("\n🕉️ May your spiritual platform serve the community well! 🙏")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)