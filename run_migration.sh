#!/bin/bash
# Script to run the todays_count column migration
# Run this script to add the todays_count column to the harijap_progress table

echo "🔄 Running migration: Add todays_count column to harijap_progress table..."

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client or run the migration manually."
    echo "📄 Migration file: migrations/add_todays_count_column.sql"
    exit 1
fi

# Run the migration
mysql -u root -p < migrations/add_todays_count_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📊 The todays_count column has been added to harijap_progress table."
else
    echo "❌ Migration failed. Please check the error messages above."
    echo "📄 You can run the migration manually using the SQL file: migrations/add_todays_count_column.sql"
fi
