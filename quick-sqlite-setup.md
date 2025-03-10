# Quick SQLite Setup Guide

This guide provides simple steps to set up your invoice generator app with an embedded SQLite database for local development.

## Overview

SQLite is a lightweight, file-based database that can be embedded directly into your application. This eliminates the need for a separate database server, making local development much simpler.

## Setup Steps

### 1. Install SQLite Dependencies

```bash
cd timesheet-backend
npm install better-sqlite3
```

### 2. Use the SQLite Server Implementation

I've created a ready-to-use SQLite implementation of your server at `timesheet-backend/server.sqlite.js`. This file:

- Creates a SQLite database file in your project directory
- Sets up all the necessary tables
- Includes sample data to get started
- Implements all the same API endpoints as your original server

### 3. Run the SQLite Server

```bash
cd timesheet-backend
node server.sqlite.js
```

That's it! Your backend is now running with an embedded SQLite database.

## What's Included

The SQLite implementation:

- Creates a `timesheet.db` file in your timesheet-backend directory
- Sets up all the tables from your original schema
- Adds sample data for employees and jobs
- Implements all the same API endpoints
- Handles all the same functionality as your PostgreSQL version

## Benefits for Local Development

- No need to set up or connect to a separate database
- No database credentials to manage
- The database is just a file in your project
- Easy to reset by deleting the database file
- Works offline without any external dependencies

## How It Works

The SQLite implementation:

1. Creates a database connection to a local file
2. Runs migrations to set up the schema
3. Inserts sample data
4. Provides all the same API endpoints

The database is stored in a file called `timesheet.db` in your timesheet-backend directory. This file contains all your data and is created automatically when you run the server.

## Next Steps

If you want to make this the default implementation:

```bash
# Backup the original server.js (optional)
mv timesheet-backend/server.js timesheet-backend/server.pg.js

# Use the SQLite version as the main server
cp timesheet-backend/server.sqlite.js timesheet-backend/server.js
```

## Troubleshooting

If you encounter any issues:

1. Make sure you've installed the `better-sqlite3` package
2. Check that the server is running on the expected port (3000)
3. If you need to reset the database, simply delete the `timesheet.db` file and restart the server
