# SQLite Implementation Guide

This guide provides step-by-step instructions for migrating your invoice generator application from PostgreSQL to SQLite.

## Overview

SQLite is a lightweight, file-based database that can be embedded directly into your application. This eliminates the need for a separate database server, simplifying your deployment and reducing resource usage.

## Prerequisites

- Node.js and npm installed
- Access to your current PostgreSQL database (for data migration)
- Docker (if using containerized deployment)

## Implementation Steps

### 1. Install SQLite Dependencies

```bash
cd timesheet-backend
npm install better-sqlite3
```

### 2. Update Backend Code

Replace the PostgreSQL connection code in `server.js` with SQLite:

1. Copy the `sqlite-server-example.js` file provided in this repository
2. Review and adapt it to your specific needs
3. Replace your current `server.js` file or create a new one for testing

Key changes include:
- Replacing PostgreSQL connection with SQLite
- Converting queries to use prepared statements
- Adapting any PostgreSQL-specific features

### 3. Create SQLite Migration Files

1. Convert your PostgreSQL schema to SQLite syntax:
   - Replace `SERIAL` with `INTEGER PRIMARY KEY AUTOINCREMENT`
   - Replace `TIMESTAMP WITH TIME ZONE` with `TIMESTAMP`
   - Adapt triggers and functions to SQLite syntax

2. Create a migration runner function that applies these schema changes to your SQLite database

### 4. Migrate Existing Data

Use the provided `migrate-to-sqlite.js` script to transfer data from PostgreSQL to SQLite:

```bash
# Set up environment variables
export DB_USER=your_pg_user
export DB_HOST=your_pg_host
export DB_NAME=your_pg_database
export DB_PASSWORD=your_pg_password
export DB_PORT=5432
export SQLITE_DB_PATH=./timesheet.db

# Run the migration script
node migrate-to-sqlite.js
```

### 5. Update Docker Configuration

If you're using Docker, update your configuration to use the SQLite version:

1. Replace your current `docker-compose.yml` with `docker-compose.sqlite.yml`
2. Use the `Dockerfile.sqlite` for your backend service

```bash
# Build and run with the SQLite configuration
docker-compose -f docker-compose.sqlite.yml up -d
```

### 6. Test the Application

1. Start the backend with the SQLite database
2. Verify that all API endpoints work correctly
3. Test the frontend to ensure it can communicate with the backend
4. Check that data is being stored and retrieved correctly

## Backup and Recovery

With SQLite, your database is a single file, making backup and recovery simple:

```bash
# Backup
cp /path/to/timesheet.db /path/to/backup/timesheet.db.bak

# Restore
cp /path/to/backup/timesheet.db.bak /path/to/timesheet.db
```

You can also set up automated backups using a simple cron job or script.

## Performance Considerations

SQLite works well for:
- Low to moderate traffic applications
- Single-writer scenarios (multiple readers are fine)
- Applications with straightforward database needs

If you experience performance issues with high concurrency, consider:
- Enabling WAL mode (already done in the example)
- Optimizing your queries
- Adding appropriate indexes

## Troubleshooting

### Common Issues

1. **"Database is locked" errors**
   - This can happen with concurrent writes
   - Ensure you're using WAL mode
   - Implement retry logic for write operations

2. **Migration errors**
   - Check data types compatibility
   - Ensure foreign key constraints are satisfied
   - Temporarily disable foreign key constraints during migration

3. **Performance issues**
   - Add indexes for frequently queried columns
   - Use transactions for multiple operations
   - Consider query optimization

## Conclusion

By embedding SQLite into your application, you've simplified your deployment architecture and reduced dependencies. The application should now be easier to deploy, maintain, and back up.
