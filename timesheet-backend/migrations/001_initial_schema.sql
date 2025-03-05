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
