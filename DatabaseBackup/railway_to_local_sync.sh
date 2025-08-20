#!/bin/bash

# MySQL Database Sync Script - Railway to Local
# This script downloads backup from Railway MySQL and restores to local MySQL

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from database.env
RAILWAY_HOST="shortline.proxy.rlwy.net"
RAILWAY_PORT="59452"
RAILWAY_USER="root"
RAILWAY_PASSWORD="vQqDobxyttxWhaRpZCguVUJEDxMvFdtj"
RAILWAY_DB="railway"

# Local MySQL Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="3306"
LOCAL_USER="root"
LOCAL_PASSWORD="Mybabaji@143"  # Set your local MySQL root password here
LOCAL_DB="railway_local"  # Local database name

# Backup file configuration
BACKUP_DIR="./mysql_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="railway_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required commands
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command_exists mysql; then
        print_error "MySQL client not found. Please install: sudo apt install mysql-client"
        exit 1
    fi
    
    if ! command_exists mysqldump; then
        print_error "mysqldump not found. Please install: sudo apt install mysql-client"
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Test Railway connection
test_railway_connection() {
    print_status "Testing Railway MySQL connection..."
    
    if mysql -h"$RAILWAY_HOST" -P"$RAILWAY_PORT" -u"$RAILWAY_USER" -p"$RAILWAY_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "Railway MySQL connection successful"
    else
        print_error "Failed to connect to Railway MySQL"
        print_error "Please check your Railway credentials"
        exit 1
    fi
}

# Test local connection
test_local_connection() {
    print_status "Testing local MySQL connection..."
    
    if [ -z "$LOCAL_PASSWORD" ]; then
        if mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "Local MySQL connection successful"
        else
            print_error "Failed to connect to local MySQL"
            print_error "Please check your local MySQL credentials"
            exit 1
        fi
    else
        if mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -p"$LOCAL_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "Local MySQL connection successful"
        else
            print_error "Failed to connect to local MySQL"
            print_error "Please check your local MySQL credentials"
            exit 1
        fi
    fi
}

# Create backup from Railway
create_railway_backup() {
    print_status "Creating backup from Railway database..."
    
    mysqldump -h"$RAILWAY_HOST" \
              -P"$RAILWAY_PORT" \
              -u"$RAILWAY_USER" \
              -p"$RAILWAY_PASSWORD" \
              --single-transaction \
              --routines \
              --triggers \
              --databases "$RAILWAY_DB" > "$BACKUP_PATH"
    
    if [ $? -eq 0 ]; then
        print_success "Backup created successfully: $BACKUP_PATH"
        
        # Show backup file size
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        print_status "Backup file size: $BACKUP_SIZE"
    else
        print_error "Failed to create backup"
        exit 1
    fi
}

# Create local database if not exists
create_local_database() {
    print_status "Creating local database '$LOCAL_DB' if not exists..."
    
    if [ -z "$LOCAL_PASSWORD" ]; then
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -e "CREATE DATABASE IF NOT EXISTS $LOCAL_DB;"
    else
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -p"$LOCAL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $LOCAL_DB;"
    fi
    
    print_success "Local database '$LOCAL_DB' ready"
}

# Restore backup to local database
restore_to_local() {
    print_status "Restoring backup to local database..."
    
    # Modify the backup file to use the local database name
    sed -i "s/CREATE DATABASE.*\`$RAILWAY_DB\`/CREATE DATABASE IF NOT EXISTS \`$LOCAL_DB\`/g" "$BACKUP_PATH"
    sed -i "s/USE \`$RAILWAY_DB\`/USE \`$LOCAL_DB\`/g" "$BACKUP_PATH"
    
    if [ -z "$LOCAL_PASSWORD" ]; then
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" < "$BACKUP_PATH"
    else
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -p"$LOCAL_PASSWORD" < "$BACKUP_PATH"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Database restored successfully to local '$LOCAL_DB'"
    else
        print_error "Failed to restore database"
        exit 1
    fi
}

# Verify restoration
verify_restoration() {
    print_status "Verifying restoration..."
    
    if [ -z "$LOCAL_PASSWORD" ]; then
        TABLE_COUNT=$(mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -D"$LOCAL_DB" -e "SHOW TABLES;" | wc -l)
    else
        TABLE_COUNT=$(mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -p"$LOCAL_PASSWORD" -D"$LOCAL_DB" -e "SHOW TABLES;" | wc -l)
    fi
    
    # Subtract 1 for header row
    TABLE_COUNT=$((TABLE_COUNT - 1))
    
    print_success "Restoration verified. Found $TABLE_COUNT tables in local database"
}

# Cleanup old backups (keep last 5)
cleanup_old_backups() {
    print_status "Cleaning up old backup files (keeping last 5)..."
    
    cd "$BACKUP_DIR"
    ls -1t railway_backup_*.sql | tail -n +6 | xargs -r rm --
    
    REMAINING_COUNT=$(ls -1 railway_backup_*.sql 2>/dev/null | wc -l)
    print_success "Cleanup completed. $REMAINING_COUNT backup files remaining"
}

# Show local databases
show_local_databases() {
    print_status "Current local databases:"
    
    if [ -z "$LOCAL_PASSWORD" ]; then
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -e "SHOW DATABASES;"
    else
        mysql -h"$LOCAL_HOST" -P"$LOCAL_PORT" -u"$LOCAL_USER" -p"$LOCAL_PASSWORD" -e "SHOW DATABASES;"
    fi
}

# Main execution
main() {
    echo "========================================="
    echo "Railway to Local MySQL Sync Script"
    echo "========================================="
    
    # Get user confirmation
    print_warning "This will replace your local '$LOCAL_DB' database with Railway data."
    printf "Do you want to continue? (y/N): "
    read REPLY
    
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
        print_status "Operation cancelled by user"
        exit 0
    fi
    
    # Execute all steps
    check_requirements
    create_backup_dir
    test_railway_connection
    test_local_connection
    create_railway_backup
    create_local_database
    restore_to_local
    verify_restoration
    cleanup_old_backups
    show_local_databases
    
    print_success "Database sync completed successfully!"
    print_status "Local database '$LOCAL_DB' now contains Railway data"
    print_status "Backup saved at: $BACKUP_PATH"
}

# Run main function
main "$@"
