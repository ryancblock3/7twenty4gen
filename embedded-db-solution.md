# Embedded Database Solution for Invoice Generator

## Current Setup
The application currently uses a three-tier architecture:
- Frontend (React)
- Backend (Express.js)
- Database (PostgreSQL in a separate container)

## Proposed Solution: SQLite Integration

SQLite is a self-contained, serverless SQL database engine that can be embedded directly into the application. This would eliminate the need for a separate database container while maintaining most of the existing codebase structure.

### Benefits
- No separate database to manage
- Single container deployment
- File-based storage (easy backups)
- Reduced complexity
- Lower resource usage

### Implementation Steps

1. **Install SQLite dependencies**
   ```bash
   cd timesheet-backend
   npm install better-sqlite3
   ```

2. **Modify database connection in server.js**
   Replace the PostgreSQL connection with SQLite:
   ```javascript
   // Replace PostgreSQL connection
   const Database = require('better-sqlite3');
   const path = require('path');
   
   // Database file path
   const dbPath = process.env.DB_PATH || path.join(__dirname, 'timesheet.db');
   
   // Create database connection
   const db = new Database(dbPath, { verbose: console.log });
   ```

3. **Adapt migrations**
   - Convert PostgreSQL-specific SQL to SQLite-compatible syntax
   - Create a migration runner for SQLite

4. **Update queries in server.js**
   - Replace PostgreSQL pool.query() calls with SQLite prepared statements
   - Adapt any PostgreSQL-specific features

5. **Update Docker configuration**
   - Remove the separate database service
   - Configure volume for SQLite database file persistence

### Migration Considerations

#### Schema Adjustments
- Replace `SERIAL` with `INTEGER PRIMARY KEY AUTOINCREMENT`
- Replace `TIMESTAMP WITH TIME ZONE` with `TIMESTAMP`
- Adapt the trigger syntax for SQLite

#### Example Migration Conversion

**PostgreSQL:**
```sql
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
```

**SQLite:**
```sql
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  regular_rate REAL NOT NULL,
  overtime_rate REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Query Conversion Examples

**PostgreSQL:**
```javascript
const { rows } = await pool.query('SELECT * FROM employees');
res.json(rows);
```

**SQLite:**
```javascript
const rows = db.prepare('SELECT * FROM employees').all();
res.json(rows);
```

### Docker Configuration Update

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./invoice-generator/invoice-generator
    container_name: invoice-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./timesheet-backend
    container_name: timesheet-backend
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - PORT=3000
      - DB_PATH=/app/data/timesheet.db
    volumes:
      - sqlite_data:/app/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  sqlite_data:
```

## Implementation Plan

1. Create a backup of the current PostgreSQL data
2. Implement SQLite adapter in a development environment
3. Test migration and functionality
4. Update Docker configuration
5. Deploy the updated solution

This approach allows for a lightweight, embedded database solution while maintaining most of the existing application structure and functionality.
