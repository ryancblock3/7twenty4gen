# Invoice Generator Application

This repository contains a full-stack invoice generator application with a React frontend and Express.js backend.

## Project Structure

- `invoice-generator/`: Frontend React application
- `timesheet-backend/`: Backend Express.js application with SQLite database

## Prerequisites

- Node.js
- Git

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

3. Install dependencies and start the backend:
   ```bash
   cd timesheet-backend
   npm install
   npm start
   ```

4. In a separate terminal, install dependencies and start the frontend:
   ```bash
   cd invoice-generator/invoice-generator
   npm install
   npm start
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api

## Database

The application uses SQLite for data storage:

- The database file is located at `timesheet-backend/timesheet.db`
- Schema is automatically created when the application starts
- Sample data is inserted for testing purposes

## Environment Variables

### Frontend (.env.production)
- `REACT_APP_API_BASE_URL`: URL for the backend API (default: http://localhost:3000/api)

### Backend (.env)
- `DB_PATH`: Path to the SQLite database file (default: timesheet.db)
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
