const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Timesheet API' });
});

// Employee Routes
app.get('/api/employees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { ee_code, last_name, first_name, regular_rate, overtime_rate } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO employees (ee_code, last_name, first_name, regular_rate, overtime_rate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ee_code, last_name, first_name, regular_rate, overtime_rate]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { ee_code, last_name, first_name, regular_rate, overtime_rate } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE employees SET ee_code = $1, last_name = $2, first_name = $3, regular_rate = $4, overtime_rate = $5 WHERE id = $6 RETURNING *',
      [ee_code, last_name, first_name, regular_rate, overtime_rate, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the employee' });
  }
});

// Job Routes
app.get('/api/jobs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM jobs');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { job_number, job_name, job_description, client_name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO jobs (job_number, job_name, job_description, client_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [job_number, job_name, job_description, client_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the job' });
  }
});

// Activity Routes
app.get('/api/activities', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM activities');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching activities' });
  }
});

app.post('/api/activities', async (req, res) => {
  const { activity_code, activity_description, job_id } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO activities (activity_code, activity_description, job_id) VALUES ($1, $2, $3) RETURNING *',
      [activity_code, activity_description, job_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the activity' });
  }
});

// Timesheet Routes
app.get('/api/timesheets', async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching timesheets' });
  }
});

app.post('/api/timesheets', async (req, res) => {
  const { employee_id, job_id, activity_id, date, hours, pay_type } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO timesheets 
       (employee_id, job_id, activity_id, date, hours, pay_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [employee_id, job_id, activity_id, date, hours, pay_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the timesheet entry' });
  }
});

// Invoice Routes
app.get('/api/invoices', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { job_id, invoice_number, week_ending, total_amount, invoice_date, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO invoices 
       (job_id, invoice_number, week_ending, total_amount, invoice_date, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [job_id, invoice_number, week_ending, total_amount, invoice_date, due_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the invoice' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;