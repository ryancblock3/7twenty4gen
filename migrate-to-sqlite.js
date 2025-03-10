#!/usr/bin/env node
/**
 * PostgreSQL to SQLite Migration Script
 * 
 * This script migrates data from a PostgreSQL database to a SQLite database.
 * It connects to both databases, extracts data from PostgreSQL, and inserts it into SQLite.
 * 
 * Usage:
 * 1. Install dependencies: npm install pg better-sqlite3 dotenv
 * 2. Configure environment variables in .env file
 * 3. Run: node migrate-to-sqlite.js
 */

const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// PostgreSQL connection
const pgPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// SQLite connection
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, 'timesheet.db');
const sqliteDb = new Database(dbPath, { verbose: console.log });

// Initialize SQLite with pragmas
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = OFF'); // Turn off during migration for faster imports

// Tables to migrate in order (respecting foreign key constraints)
const tables = [
  'employees',
  'jobs',
  'activities',
  'timesheets',
  'invoices',
  'employee_pay_history'
];

async function migrateData() {
  console.log('Starting migration from PostgreSQL to SQLite...');
  
  try {
    // Begin transaction for SQLite
    const migration = sqliteDb.transaction(() => {
      // Process each table
      for (const table of tables) {
        console.log(`Migrating table: ${table}`);
        migrateTable(table);
      }
    });
    
    // Execute the transaction
    migration();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Re-enable foreign key constraints
    sqliteDb.pragma('foreign_keys = ON');
    
    // Close connections
    await pgPool.end();
    sqliteDb.close();
  }
}

async function migrateTable(tableName) {
  try {
    // Get data from PostgreSQL
    const { rows } = await pgPool.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`No data found in table: ${tableName}`);
      return;
    }
    
    console.log(`Found ${rows.length} rows in ${tableName}`);
    
    // Get column names from the first row
    const columns = Object.keys(rows[0]);
    
    // Prepare SQLite statement
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = sqliteDb.prepare(`
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `);
    
    // Insert each row
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      try {
        stmt.run(values);
      } catch (err) {
        console.error(`Error inserting row in ${tableName}:`, err);
        console.error('Row data:', row);
      }
    }
    
    console.log(`Successfully migrated ${rows.length} rows to ${tableName}`);
  } catch (error) {
    console.error(`Error migrating table ${tableName}:`, error);
    throw error;
  }
}

// Run the migration
migrateData().catch(console.error);
