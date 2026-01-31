# ER Model Generator - Setup & Run Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm (comes with Node.js)

## Step-by-Step Setup Instructions

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm run install-deps
```

Or manually:
```bash
cd backend
npm install
cd ..
```

### 2. Database Setup

#### Option A: Fresh Database Setup
If you're setting up the database for the first time:

1. Open MySQL command line or MySQL Workbench
2. Run the schema file:
   ```sql
   source database/schema.sql
   ```
   Or copy and paste the contents of `database/schema.sql` into your MySQL client

#### Option B: Update Existing Database
If your `users` table already exists without phone columns:

1. Open MySQL command line or MySQL Workbench
2. Run the migration file:
   ```sql
   source database/migration.sql
   ```
   Or copy and paste the contents of `database/migration.sql` into your MySQL client

**Manual SQL (if needed):**
```sql
USE ai_er_converter;

ALTER TABLE users 
ADD COLUMN phone_country_code VARCHAR(8) NOT NULL DEFAULT '+91',
ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '0000000000';
```

### 3. Configure Environment Variables

1. Navigate to the `backend` folder
2. Create a `.env` file (copy from `.env.example` if it exists)
3. Add your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_er_converter
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
```

**Important:** Replace `your_mysql_password` with your actual MySQL root password.

### 4. Start the Backend Server

From the project root directory:

```bash
npm start
```

Or:
```bash
cd backend
npm start
```

You should see: `Server running on port 5000`

### 5. Start the Frontend

#### Option A: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"

#### Option B: Using Python (if installed)
```bash
cd frontend
python -m http.server 5500
```

#### Option C: Using Node.js http-server
```bash
npm install -g http-server
cd frontend
http-server -p 5500
```

### 6. Access the Application

Open your browser and navigate to:
- **Registration:** `http://localhost:5500/frontend/index.html` or `http://127.0.0.1:5500/frontend/index.html`
- **Login:** `http://localhost:5500/frontend/login.html`
- **Dashboard:** `http://localhost:5500/frontend/dashboard.html` (after login)

## Troubleshooting

### Error: "Server error" on Registration

**Most Common Cause:** Database columns missing

**Solution:**
1. Check if the `users` table has `phone_country_code` and `phone_number` columns
2. Run the migration SQL (see Step 2, Option B)
3. Restart the backend server

**Check database:**
```sql
USE ai_er_converter;
DESCRIBE users;
```

You should see:
- `phone_country_code` (VARCHAR(8))
- `phone_number` (VARCHAR(20))

### Error: "Cannot connect to database"

**Solution:**
1. Verify MySQL is running
2. Check `.env` file has correct credentials
3. Verify database `ai_er_converter` exists:
   ```sql
   SHOW DATABASES;
   ```

### Error: "JWT_SECRET is not defined"

**Solution:**
1. Make sure `.env` file exists in `backend` folder
2. Add `JWT_SECRET=any_random_string_here` to `.env`
3. Restart the server

### Port Already in Use

If port 5000 is busy:
1. Change `PORT=5000` to another port (e.g., `PORT=5001`) in `.env`
2. Update `apiUrl` in `frontend/js/auth.js` and `frontend/js/convert.js` to match

## Project Structure

```
DBMS_PBL/
├── backend/
│   ├── config/
│   │   └── db.js          # Database connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── convertController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── convert.js
│   ├── server.js          # Main server file
│   └── .env               # Environment variables (create this)
├── database/
│   ├── schema.sql         # Initial database schema
│   └── migration.sql      # Migration for existing databases
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   └── convert.js
│   ├── index.html         # Registration page
│   ├── login.html         # Login page
│   └── dashboard.html     # Main dashboard
└── package.json
```

## Features Implemented

✅ **Registration & Login:**
- Email validation with real-time feedback
- Password strength (min 8 chars, requires @ or #)
- Phone number validation (10 digits) with country code selector
- Visual validation indicators (green checkmarks)

✅ **ER Model Generation:**
- SQL to ER diagram conversion
- SQL keyword highlighting
- ER rules reference table
- Visual ER diagrams (Mermaid)
- Download as PDF or PNG

## Quick Start Commands

```bash
# Install dependencies
npm run install-deps

# Start backend server
npm start

# Start with auto-reload (development)
npm run dev
```

## Need Help?

If you encounter any issues:
1. Check the terminal/console for error messages
2. Verify database connection and schema
3. Ensure all environment variables are set correctly
4. Check that both frontend and backend servers are running






