const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection - creates the database file in the current directory
const dbPath = path.join(__dirname, 'timesheet.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database with pragmas for better performance and safety
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('foreign_keys = ON');  // Enforce foreign key constraints

console.log(`Connected to SQLite database at: ${dbPath}`);

// Helper function to run migrations
function runMigrations() {
  console.log('Running migrations...');
  
  // Create tables - each statement must be executed separately
  db.prepare(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ee_code TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      regular_rate REAL NOT NULL,
      overtime_rate REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_number TEXT NOT NULL UNIQUE,
      job_name TEXT NOT NULL,
      job_description TEXT,
      client_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_code TEXT NOT NULL,
      activity_description TEXT,
      job_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      activity_id INTEGER,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      pay_type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      week_ending TEXT,
      total_amount REAL NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoice_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      employee_name TEXT NOT NULL,
      activity_description TEXT,
      regular_hours REAL,
      overtime_hours REAL,
      regular_rate REAL,
      overtime_rate REAL,
      total_amount REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS employee_pay_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      regular_rate REAL NOT NULL,
      overtime_rate REAL NOT NULL,
      effective_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(employee_id, effective_date),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_employee_pay_history_employee_id 
    ON employee_pay_history(employee_id)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_employee_pay_history_effective_date 
    ON employee_pay_history(effective_date)
  `).run();
  
  // Create triggers for employee pay history
  db.prepare(`
    CREATE TRIGGER IF NOT EXISTS employee_pay_change_trigger
    AFTER INSERT ON employees
    BEGIN
      INSERT INTO employee_pay_history (employee_id, regular_rate, overtime_rate, effective_date)
      VALUES (new.id, new.regular_rate, new.overtime_rate, date('now'));
    END
  `).run();
  
  db.prepare(`
    CREATE TRIGGER IF NOT EXISTS employee_pay_update_trigger
    AFTER UPDATE OF regular_rate, overtime_rate ON employees
    WHEN old.regular_rate <> new.regular_rate OR old.overtime_rate <> new.overtime_rate
    BEGIN
      INSERT INTO employee_pay_history (employee_id, regular_rate, overtime_rate, effective_date)
      VALUES (new.id, new.regular_rate, new.overtime_rate, date('now'));
    END
  `).run();
  
  // Insert sample data
  try {
    // Insert employees one by one to avoid multiple statements
    db.prepare(`
      INSERT INTO employees (ee_code, first_name, last_name, regular_rate, overtime_rate)
      VALUES ('EMP001', 'John', 'Doe', 25.00, 37.50)
    `).run();
    
    db.prepare(`
      INSERT INTO employees (ee_code, first_name, last_name, regular_rate, overtime_rate)
      VALUES ('EMP002', 'Jane', 'Smith', 30.00, 45.00)
    `).run();
    
    db.prepare(`
      INSERT INTO employees (ee_code, first_name, last_name, regular_rate, overtime_rate)
      VALUES ('EMP003', 'Michael', 'Johnson', 28.50, 42.75)
    `).run();
    
    // Insert jobs one by one
    db.prepare(`
      INSERT INTO jobs (job_number, job_name, job_description, client_name)
      VALUES ('JOB001', 'Office Renovation', 'Complete renovation of office space', 'ABC Corp')
    `).run();
    
    db.prepare(`
      INSERT INTO jobs (job_number, job_name, job_description, client_name)
      VALUES ('JOB002', 'Warehouse Construction', 'New warehouse construction project', 'XYZ Logistics')
    `).run();
    
    db.prepare(`
      INSERT INTO jobs (job_number, job_name, job_description, client_name)
      VALUES ('JOB003', 'Retail Store Remodel', 'Remodeling of retail store', 'Retail Chain Inc')
    `).run();
  } catch (err) {
    // Ignore duplicate key errors for sample data
    if (!err.message.includes('UNIQUE constraint failed')) {
      throw err;
    }
  }
  
  console.log('Migrations completed successfully');
}

// Run migrations
runMigrations();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Timesheet API' });
});

// Employee Routes
app.get('/api/employees', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM employees').all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching employees' });
  }
});

// Get employee pay history
app.get('/api/employees/:id/pay-history', (req, res) => {
  const { id } = req.params;
  try {
    const rows = db.prepare(`
      SELECT 
        eph.*,
        e.first_name,
        e.last_name,
        e.ee_code
      FROM employee_pay_history eph
      JOIN employees e ON eph.employee_id = e.id
      WHERE eph.employee_id = ?
      ORDER BY eph.effective_date DESC
    `).all(id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching employee pay history' });
  }
});

// Add manual pay history entry
app.post('/api/employees/:id/pay-history', (req, res) => {
  const { id } = req.params;
  const { regular_rate, overtime_rate, effective_date, notes } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO employee_pay_history 
      (employee_id, regular_rate, overtime_rate, effective_date, notes) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(id, regular_rate, overtime_rate, effective_date, notes);
    
    if (info.changes > 0) {
      const newRecord = db.prepare('SELECT * FROM employee_pay_history WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newRecord);
    } else {
      throw new Error('Failed to insert record');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while adding employee pay history' });
  }
});

// Check for pay rate changes
app.get('/api/pay-rate-changes', (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    // SQLite doesn't support JSON functions like PostgreSQL
    // We'll need to fetch the data and transform it in JavaScript
    const employees = db.prepare(`
      SELECT 
        e.id AS employee_id,
        e.first_name,
        e.last_name,
        e.ee_code,
        e.regular_rate AS current_regular_rate,
        e.overtime_rate AS current_overtime_rate
      FROM employees e
    `).all();
    
    // For each employee, get their rate changes in the date range
    const result = employees.map(employee => {
      const rateChanges = db.prepare(`
        SELECT 
          id,
          regular_rate,
          overtime_rate,
          effective_date,
          notes
        FROM employee_pay_history
        WHERE employee_id = ? 
        AND effective_date BETWEEN ? AND ?
        ORDER BY effective_date DESC
      `).all(employee.employee_id, start_date, end_date);
      
      if (rateChanges.length > 0) {
        return {
          ...employee,
          rate_changes: rateChanges
        };
      }
      return null;
    }).filter(Boolean); // Remove null entries (employees with no rate changes)
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while checking for pay rate changes' });
  }
});

app.post('/api/employees', (req, res) => {
  const { ee_code, last_name, first_name, regular_rate, overtime_rate } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO employees 
      (ee_code, last_name, first_name, regular_rate, overtime_rate) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(ee_code, last_name, first_name, regular_rate, overtime_rate);
    
    if (info.changes > 0) {
      const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newEmployee);
    } else {
      throw new Error('Failed to insert employee');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the employee' });
  }
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { ee_code, last_name, first_name, regular_rate, overtime_rate } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE employees 
      SET ee_code = ?, last_name = ?, first_name = ?, regular_rate = ?, overtime_rate = ? 
      WHERE id = ?
    `);
    
    const info = stmt.run(ee_code, last_name, first_name, regular_rate, overtime_rate, id);
    
    if (info.changes > 0) {
      const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
      res.json(updatedEmployee);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the employee' });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the employee' });
  }
});

// Job Routes
app.get('/api/jobs', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM jobs').all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching jobs' });
  }
});

app.post('/api/jobs', (req, res) => {
  const { job_number, job_name, job_description, client_name } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO jobs 
      (job_number, job_name, job_description, client_name) 
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(job_number, job_name, job_description, client_name);
    
    if (info.changes > 0) {
      const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newJob);
    } else {
      throw new Error('Failed to insert job');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the job' });
  }
});

// Activity Routes
app.get('/api/activities', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM activities').all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching activities' });
  }
});

app.post('/api/activities', (req, res) => {
  const { activity_code, activity_description, job_id } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO activities 
      (activity_code, activity_description, job_id) 
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run(activity_code, activity_description, job_id);
    
    if (info.changes > 0) {
      const newActivity = db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newActivity);
    } else {
      throw new Error('Failed to insert activity');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the activity' });
  }
});

// Timesheet Routes
app.get('/api/timesheets', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        t.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        j.job_name,
        a.activity_description
      FROM timesheets t
      JOIN employees e ON t.employee_id = e.id
      JOIN jobs j ON t.job_id = j.id
      LEFT JOIN activities a ON t.activity_id = a.id
      ORDER BY t.date DESC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching timesheets' });
  }
});

app.post('/api/timesheets', (req, res) => {
  const { employee_id, job_id, activity_id, date, hours, pay_type } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO timesheets 
      (employee_id, job_id, activity_id, date, hours, pay_type) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(employee_id, job_id, activity_id, date, hours, pay_type);
    
    if (info.changes > 0) {
      const newTimesheet = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newTimesheet);
    } else {
      throw new Error('Failed to insert timesheet entry');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the timesheet entry' });
  }
});

// Invoice Routes
app.get('/api/invoices', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT i.*, j.job_name, j.job_number, j.client_name FROM invoices i JOIN jobs j ON i.job_id = j.id';
    
    if (start_date && end_date) {
      query += ' WHERE i.invoice_date BETWEEN ? AND ?';
      const rows = db.prepare(query).all(start_date, end_date);
      res.json(rows);
    } else {
      const rows = db.prepare(query).all();
      res.json(rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching invoices' });
  }
});

// Get invoice details
app.get('/api/invoices/:id/details', (req, res) => {
  const { id } = req.params;
  try {
    // Get the invoice
    const invoice = db.prepare(`
      SELECT i.*, j.job_name, j.job_number, j.client_name 
      FROM invoices i 
      JOIN jobs j ON i.job_id = j.id 
      WHERE i.id = ?
    `).get(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // First, check if we have invoice details in the invoice_details table
    const invoiceDetails = db.prepare(`
      SELECT * FROM invoice_details WHERE invoice_id = ?
    `).all(id);
    
    if (invoiceDetails.length > 0) {
      // If we have invoice details, return them
      const timesheetEntries = invoiceDetails.map(detail => ({
        id: detail.id,
        employee_id: null,
        job_id: invoice.job_id,
        activity_id: null,
        date: invoice.week_ending,
        hours: detail.regular_hours + detail.overtime_hours,
        pay_type: detail.overtime_hours > 0 ? "Overtime" : "Regular",
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        employee_first_name: detail.employee_name.split(' ')[0] || '',
        employee_last_name: detail.employee_name.split(' ')[1] || '',
        employee_code: "",
        activity_code: "",
        activity_description: detail.activity_description,
        regular_hours: detail.regular_hours,
        overtime_hours: detail.overtime_hours,
        regular_rate: detail.regular_rate,
        overtime_rate: detail.overtime_rate,
        total: detail.total_amount
      }));
      
      res.json({
        invoice,
        timesheetEntries
      });
    } else {
      // If we don't have invoice details, try to get timesheet entries
      // Calculate the start date (week beginning) - 6 days before week ending
      const weekEndingDate = new Date(invoice.week_ending);
      const weekBeginningDate = new Date(weekEndingDate);
      weekBeginningDate.setDate(weekEndingDate.getDate() - 6);
      const weekBeginning = weekBeginningDate.toISOString().split('T')[0];
      
      const timesheetEntries = db.prepare(`
        SELECT 
          t.*,
          e.first_name as employee_first_name,
          e.last_name as employee_last_name,
          e.ee_code as employee_code,
          a.activity_code,
          a.activity_description
        FROM timesheets t
        JOIN employees e ON t.employee_id = e.id
        JOIN jobs j ON t.job_id = j.id
        LEFT JOIN activities a ON t.activity_id = a.id
        WHERE j.id = ? AND t.date BETWEEN ? AND ?
        ORDER BY t.date DESC
      `).all(invoice.job_id, weekBeginning, invoice.week_ending);
      
      // Return the actual timesheet entries, even if the array is empty
      res.json({
        invoice,
        timesheetEntries
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching invoice details' });
  }
});

app.post('/api/invoices', (req, res) => {
  const { job_id, invoice_number, week_ending, total_amount, invoice_date, due_date, invoice_details } = req.body;
  try {
    // Start a transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    // Insert the invoice
    const stmt = db.prepare(`
      INSERT INTO invoices 
      (job_id, invoice_number, week_ending, total_amount, invoice_date, due_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(job_id, invoice_number, week_ending, total_amount, invoice_date, due_date);
    
    if (info.changes > 0) {
      const newInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(info.lastInsertRowid);
      
      // If invoice details are provided, insert them
      if (invoice_details && Array.isArray(invoice_details) && invoice_details.length > 0) {
        const detailStmt = db.prepare(`
          INSERT INTO invoice_details 
          (invoice_id, employee_name, activity_description, regular_hours, overtime_hours, regular_rate, overtime_rate, total_amount) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const detail of invoice_details) {
          detailStmt.run(
            newInvoice.id,
            detail.employee_name,
            detail.activity_description,
            detail.regular_hours || 0,
            detail.overtime_hours || 0,
            detail.regular_rate || 0,
            detail.overtime_rate || 0,
            detail.total_amount || 0
          );
        }
      }
      
      // Commit the transaction
      db.prepare('COMMIT').run();
      
      res.status(201).json(newInvoice);
    } else {
      // Rollback the transaction
      db.prepare('ROLLBACK').run();
      throw new Error('Failed to insert invoice');
    }
  } catch (err) {
    // Rollback the transaction
    db.prepare('ROLLBACK').run();
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the invoice' });
  }
});

// Add invoice details to an existing invoice
app.post('/api/invoices/:id/details', (req, res) => {
  const { id } = req.params;
  const { invoice_details } = req.body;
  
  if (!invoice_details || !Array.isArray(invoice_details) || invoice_details.length === 0) {
    return res.status(400).json({ error: 'Invoice details are required' });
  }
  
  try {
    // Check if the invoice exists
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Start a transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    // Delete any existing invoice details
    db.prepare('DELETE FROM invoice_details WHERE invoice_id = ?').run(id);
    
    // Insert the new invoice details
    const detailStmt = db.prepare(`
      INSERT INTO invoice_details 
      (invoice_id, employee_name, activity_description, regular_hours, overtime_hours, regular_rate, overtime_rate, total_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const detail of invoice_details) {
      detailStmt.run(
        id,
        detail.employee_name,
        detail.activity_description,
        detail.regular_hours || 0,
        detail.overtime_hours || 0,
        detail.regular_rate || 0,
        detail.overtime_rate || 0,
        detail.total_amount || 0
      );
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    res.status(201).json({ message: 'Invoice details added successfully' });
  } catch (err) {
    // Rollback the transaction
    db.prepare('ROLLBACK').run();
    console.error(err);
    res.status(500).json({ error: 'An error occurred while adding invoice details' });
  }
});

// Delete invoice
app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the invoice' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
