#!/bin/bash

# Unraid Setup Database Script
# This script helps set up the database for the timesheet application on Unraid

echo "=== Timesheet Application Database Setup for Unraid ==="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.unraid.yml" ]; then
  echo "Error: docker-compose.unraid.yml not found."
  echo "Please run this script from the directory containing docker-compose.unraid.yml"
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "DB_USER=postgres" > .env
  echo "DB_NAME=timesheet_db" >> .env
  echo "DB_PASSWORD=your_secure_password" >> .env
  echo ""
  echo "IMPORTANT: Edit the .env file to set a secure password!"
  echo ""
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p /mnt/user/appdata/invoice-generator/postgres_data
mkdir -p /mnt/user/appdata/invoice-generator/frontend-logs
mkdir -p /mnt/user/appdata/invoice-generator/backend-logs
mkdir -p /mnt/user/appdata/invoice-generator/timesheet-backend/migrations

# Copy migration files
echo "Copying migration files..."
cp timesheet-backend/migrations/*.sql /mnt/user/appdata/invoice-generator/timesheet-backend/migrations/

# Copy migration runner
echo "Copying migration runner..."
cp timesheet-backend/run-migrations.js /mnt/user/appdata/invoice-generator/timesheet-backend/

# Start the application
echo "Starting the application..."
docker-compose -f docker-compose.unraid.yml up -d

# Wait for the database to be ready
echo "Waiting for the database to be ready..."
sleep 15

# Run migrations
echo "Running database migrations..."
docker-compose -f docker-compose.unraid.yml exec timesheet-backend node run-migrations.js

echo ""
echo "=== Database setup complete! ==="
echo ""
echo "The application should now have the following tables:"
echo "- employees: Store employee information"
echo "- jobs: Store job information"
echo "- activities: Store activity information"
echo "- timesheets: Store timesheet entries"
echo "- invoices: Store invoice information"
echo "- employee_pay_history: Track employee pay rate changes"
echo ""
echo "Sample data has been added for testing purposes."
echo ""
echo "You can now access the application at: http://your-unraid-ip"
echo ""
echo "If you encounter any issues, check the logs with:"
echo "docker logs timesheet-backend"
echo "docker logs postgres-db"
echo ""
