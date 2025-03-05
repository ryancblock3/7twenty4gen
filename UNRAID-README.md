# Invoice Generator with Employee Pay History - Unraid Setup

This README provides instructions for setting up the Invoice Generator application with Employee Pay History tracking on an Unraid server.

## Quick Start

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Copy the necessary files to your Unraid server:
   ```bash
   # Using scp (replace username and server-ip with your values)
   scp docker-compose.unraid.yml username@server-ip:/mnt/user/appdata/invoice-generator/docker-compose.yml
   scp unraid-setup-database.sh username@server-ip:/mnt/user/appdata/invoice-generator/
   scp -r timesheet-backend/migrations username@server-ip:/mnt/user/appdata/invoice-generator/timesheet-backend/
   scp timesheet-backend/run-migrations.js username@server-ip:/mnt/user/appdata/invoice-generator/timesheet-backend/
   ```

3. SSH into your Unraid server:
   ```bash
   ssh username@server-ip
   ```

4. Navigate to the application directory and run the setup script:
   ```bash
   cd /mnt/user/appdata/invoice-generator
   chmod +x unraid-setup-database.sh
   ./unraid-setup-database.sh
   ```

5. Access the application at `http://your-unraid-ip`

## What's Included

- **Frontend**: React application for invoice generation and employee management
- **Backend**: Express.js API for data management
- **Database**: PostgreSQL database with automatic migrations
- **Employee Pay History**: Track employee pay rate changes over time

## Employee Pay History Feature

The application includes a feature to track employee pay rate changes over time:

1. **Automatic Tracking**: Pay rate changes are automatically recorded when an employee's pay rate is updated
2. **Pay History View**: View the complete pay rate history for any employee
3. **Change Notifications**: Get notified when an employee's pay rate changes between timesheet periods
4. **Manual Entries**: Add manual pay rate history entries with notes for record-keeping

## Database Structure

The database includes the following tables:

- `employees`: Store employee information
- `jobs`: Store job information
- `activities`: Store activity information
- `timesheets`: Store timesheet entries
- `invoices`: Store invoice information
- `employee_pay_history`: Track employee pay rate changes

## Troubleshooting

If you encounter issues:

1. Check container logs:
   ```bash
   docker logs timesheet-backend
   docker logs postgres-db
   ```

2. Manually run migrations:
   ```bash
   docker-compose exec timesheet-backend node run-migrations.js
   ```

3. Restart the application:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

For more detailed instructions, see the [Unraid Setup Guide](unraid-setup-guide-updated.md).
