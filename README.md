# Invoice Generator Application

This repository contains a full-stack invoice generator application with a React frontend and Express.js backend.

## Project Structure

- `invoice-generator/`: Frontend React application
- `timesheet-backend/`: Backend Express.js application
  - `migrations/`: Database migration scripts
- `docker-compose.yml`: Docker Compose configuration for local development and production

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Git
- Unraid server (for deployment)
- GitHub account (for CI/CD)

## Features

- **Invoice Generation**: Create professional invoices from timesheet data
- **Timesheet Processing**: Process and format Excel timesheet data
- **Timesheet Entry**: Enter and manage employee timesheet data
- **Employee Pay History**: Track employee pay rates and get notified of changes
  - View historical pay rate changes for each employee
  - Automatic detection of pay rate changes between timesheet periods
  - Notifications when pay rates change from week to week

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Run the setup script to initialize the database:
   ```bash
   ./setup-database.sh
   ```
   This script will:
   - Start the application using Docker Compose
   - Run all database migrations
   - Create the necessary tables
   - Add sample data for testing

4. Alternatively, you can manually start the application and run migrations:
   ```bash
   # Start the application
   docker-compose up -d
   
   # Run migrations
   docker-compose exec timesheet-backend npm run migrate
   ```

5. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:3000/api

## Docker Setup

The application is containerized using Docker:

- Frontend: Nginx serving the React build
- Backend: Node.js Express application
- Database: PostgreSQL

## CI/CD Pipeline

The application uses GitHub Actions for CI/CD:

1. On push to main branch:
   - Build and test the application
   - Build and push Docker images to Docker Hub
   - Deploy to Unraid server

2. Required GitHub Secrets:
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_TOKEN`: Your Docker Hub access token
   - `UNRAID_HOST`: Your Unraid server hostname or IP
   - `UNRAID_USERNAME`: SSH username for Unraid server
   - `UNRAID_SSH_KEY`: SSH private key for Unraid server

## Unraid Deployment

1. Set up a Docker container in Unraid using the docker-compose.yml file
2. Configure the CI/CD pipeline to deploy to your Unraid server
3. Ensure the required environment variables are set in Unraid

## Database Migrations

The application uses a simple migration system to manage database schema changes:

1. Migrations are stored in the `timesheet-backend/migrations/` directory as SQL files
2. The migration runner (`run-migrations.js`) tracks applied migrations in a `migrations` table
3. Migrations are automatically applied when the backend container starts
4. You can manually run migrations with:
   ```bash
   docker-compose exec backend npm run migrate
   ```

## Environment Variables

### Frontend (.env.production)
- `REACT_APP_API_BASE_URL`: URL for the backend API

### Backend (.env)
- `DB_USER`: PostgreSQL username
- `DB_HOST`: PostgreSQL host (db for Docker)
- `DB_NAME`: PostgreSQL database name
- `DB_PASSWORD`: PostgreSQL password
- `DB_PORT`: PostgreSQL port (default: 5432)
- `PORT`: Backend server port (default: 3000)

## Employee Pay History Feature

The application includes a feature to track employee pay rate changes over time:

1. **Automatic Tracking**: Pay rate changes are automatically recorded when an employee's pay rate is updated
2. **Pay History View**: View the complete pay rate history for any employee
3. **Change Notifications**: Get notified when an employee's pay rate changes between timesheet periods
4. **Manual Entries**: Add manual pay rate history entries with notes for record-keeping

### Using the Pay History Feature

1. **View Pay History**:
   - Navigate to the "Pay History" page from the main navigation
   - Select an employee from the dropdown to view their complete pay rate history
   - The history shows both regular and overtime rates with effective dates

2. **Add Manual Pay Rate Changes**:
   - On the Pay History page, click "Add Pay Rate Change"
   - Enter the new regular and overtime rates
   - Set the effective date for the change
   - Add optional notes to document the reason for the change
   - Click "Save Pay Rate" to record the change

3. **Pay Rate Change Notifications**:
   - When processing timesheets, the system automatically checks for pay rate changes
   - If any employee's pay rate changed during the timesheet period, a notification will appear
   - Click "Show details" to see the specific changes for each employee

### Database Structure

The feature uses a dedicated `employee_pay_history` table with the following structure:
- `employee_id`: Reference to the employee
- `regular_rate`: The regular hourly rate
- `overtime_rate`: The overtime hourly rate
- `effective_date`: When the rate became effective
- `notes`: Optional notes about the rate change

A database trigger automatically records changes to employee pay rates, ensuring a complete history is maintained.
