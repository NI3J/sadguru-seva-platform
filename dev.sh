#!/bin/bash
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