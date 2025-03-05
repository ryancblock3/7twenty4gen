# Unraid Setup Guide for Invoice Generator with Employee Pay History

This guide provides step-by-step instructions for setting up the Invoice Generator application with Employee Pay History tracking on an Unraid server.

## Prerequisites

- Unraid server with Docker support enabled
- SSH access to your Unraid server
- Docker Hub account (for CI/CD)

## Manual Setup

### 1. Create a Directory for the Application

```bash
mkdir -p /mnt/user/appdata/invoice-generator
cd /mnt/user/appdata/invoice-generator
```

### 2. Create Environment Files

Create a `.env` file with your database credentials:

```bash
cat > .env << EOL
DB_USER=postgres
DB_NAME=timesheet_db
DB_PASSWORD=your_secure_password
EOL
```

### 3. Download the Docker Compose File

```bash
wget -O docker-compose.yml https://raw.githubusercontent.com/yourusername/invoice-generator/main/docker-compose.yml
```

### 4. Create Migration Directory and Files

Create the migrations directory:

```bash
mkdir -p timesheet-backend/migrations
```

Create the initial schema migration:

```bash
cat > timesheet-backend/migrations/001_initial_schema.sql << 'EOL'
-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  ee_code VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  regular_rate NUMERIC(10, 2) NOT NULL,
  overtime_rate NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_number VARCHAR(50) NOT NULL UNIQUE,
  job_name VARCHAR(255) NOT NULL,
  job_description TEXT,
  client_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  activity_code VARCHAR(50) NOT NULL,
  activity_description TEXT,
  job_id INTEGER REFERENCES jobs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  activity_id INTEGER REFERENCES activities(id),
  date DATE NOT NULL,
  hours NUMERIC(10, 2) NOT NULL,
  pay_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  week_ending DATE,
  total_amount NUMERIC(10, 2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO employees (ee_code, first_name, last_name, regular_rate, overtime_rate)
VALUES 
  ('EMP001', 'John', 'Doe', 25.00, 37.50),
  ('EMP002', 'Jane', 'Smith', 30.00, 45.00),
  ('EMP003', 'Michael', 'Johnson', 28.50, 42.75)
ON CONFLICT (ee_code) DO NOTHING;

INSERT INTO jobs (job_number, job_name, job_description, client_name)
VALUES 
  ('JOB001', 'Office Renovation', 'Complete renovation of office space', 'ABC Corp'),
  ('JOB002', 'Warehouse Construction', 'New warehouse construction project', 'XYZ Logistics'),
  ('JOB003', 'Retail Store Remodel', 'Remodeling of retail store', 'Retail Chain Inc')
ON CONFLICT (job_number) DO NOTHING;
EOL
```

Create the employee pay history migration:

```bash
cat > timesheet-backend/migrations/002_employee_pay_history.sql << 'EOL'
-- Create employee_pay_history table
CREATE TABLE IF NOT EXISTS employee_pay_history (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  regular_rate NUMERIC(10, 2) NOT NULL,
  overtime_rate NUMERIC(10, 2) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT unique_employee_date UNIQUE (employee_id, effective_date)
);

-- Create index for faster lookups
CREATE INDEX idx_employee_pay_history_employee_id ON employee_pay_history(employee_id);
CREATE INDEX idx_employee_pay_history_effective_date ON employee_pay_history(effective_date);

-- Function to automatically record pay rate changes
CREATE OR REPLACE FUNCTION record_employee_pay_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert a record if the rates have changed
  IF (TG_OP = 'UPDATE' AND (OLD.regular_rate <> NEW.regular_rate OR OLD.overtime_rate <> NEW.overtime_rate)) OR TG_OP = 'INSERT' THEN
    INSERT INTO employee_pay_history (employee_id, regular_rate, overtime_rate, effective_date)
    VALUES (NEW.id, NEW.regular_rate, NEW.overtime_rate, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to record pay rate changes when an employee is created or updated
DROP TRIGGER IF EXISTS employee_pay_change_trigger ON employees;
CREATE TRIGGER employee_pay_change_trigger
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION record_employee_pay_change();
EOL
```

### 5. Create Migration Runner Script

```bash
cat > timesheet-backend/run-migrations.js << 'EOL'
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get already applied migrations
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);
    
    // Run each migration that hasn't been applied yet
    for (const file of migrationFiles) {
      if (appliedMigrationNames.includes(file)) {
        console.log(`Migration ${file} already applied, skipping.`);
        continue;
      }
      
      console.log(`Applying migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      // Start a transaction for the migration
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Run the migration
        await client.query(migrationSql);
        
        // Record the migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`Successfully applied migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, err);
        throw err;
      } finally {
        client.release();
      }
    }
    
    console.log('All migrations completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
EOL
```

### 6. Create Setup Script

```bash
cat > setup-database.sh << 'EOL'
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
if ! docker ps | grep -q "timesheet-backend"; then
  echo "Starting the application with docker-compose..."
  docker-compose up -d
  
  # Wait for the database to be ready
  echo "Waiting for the database to be ready..."
  sleep 10
fi

echo "Running database migrations..."
docker-compose exec timesheet-backend node run-migrations.js

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
EOL

chmod +x setup-database.sh
```

### 7. Start the Application

```bash
docker-compose up -d
```

### 8. Run Database Migrations

```bash
./setup-database.sh
```

## Accessing the Application

After deployment, you can access the application at:

- Frontend: `http://your-unraid-ip`
- Backend API: `http://your-unraid-ip:3000/api`

## Employee Pay History Feature

The application now includes a feature to track employee pay rate changes over time:

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

## Persistent Storage

The PostgreSQL database data is stored in a Docker volume. To ensure data persistence across container restarts, the volume is mounted to:

```
/mnt/user/appdata/invoice-generator/postgres_data
```

## Troubleshooting

### Check Container Status

```bash
docker ps -a | grep invoice
```

### View Container Logs

```bash
docker logs invoice-frontend
docker logs timesheet-backend
docker logs postgres-db
```

### Restart Containers

```bash
cd /mnt/user/appdata/invoice-generator
docker-compose restart
```

### Rebuild and Restart

```bash
cd /mnt/user/appdata/invoice-generator
docker-compose down
docker-compose up -d
```

### Database Migration Issues

If you encounter issues with database migrations:

```bash
# Check migration logs
docker logs timesheet-backend

# Manually run migrations
docker-compose exec timesheet-backend node run-migrations.js

# Connect to the database directly
docker-compose exec db psql -U postgres -d timesheet_db
