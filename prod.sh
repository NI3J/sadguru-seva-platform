#!/bin/bash
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