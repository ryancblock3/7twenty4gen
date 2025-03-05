#!/bin/bash

# Setup Database Script
# This script helps set up the database for the timesheet application

echo "=== Timesheet Application Database Setup ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running or not installed."
  echo "Please start Docker and try again."
  exit 1
fi

# Check if the application is running
if ! docker-compose ps | grep -q "Up"; then
  echo "Starting the application with docker-compose..."
  docker-compose up -d
  
  # Wait for the database to be ready
  echo "Waiting for the database to be ready..."
  sleep 10
fi

echo "Running database migrations..."
docker-compose exec timesheet-backend npm run migrate

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
echo "You can now access the application at: http://localhost"
echo ""
