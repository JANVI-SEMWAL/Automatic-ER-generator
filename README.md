# ER Model Generator - AI ER Converter

Convert SQL DDL statements to Entity-Relationship diagrams and vice versa.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL Server
- npm

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm run install-deps
   ```

2. **Setup Database**
   - Create MySQL database: `CREATE DATABASE ai_er_converter;`
   - Run schema: Import `database/schema.sql` into MySQL
   - **OR** if table exists, run migration: Import `database/migration.sql`

3. **Configure Environment**
   - Create `backend/.env` file:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ai_er_converter
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

4. **Start Backend Server**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`

5. **Start Frontend**
   - Use VS Code Live Server extension, OR
   - Python: `cd frontend && python -m http.server 5500`
   - Open: `http://localhost:5500/frontend/index.html`

## 🔧 Fix "Server Error" on Registration

**Most Common Issue:** Missing database columns

**Quick Fix:**
```sql
USE ai_er_converter;
ALTER TABLE users ADD COLUMN phone_country_code VARCHAR(8) NOT NULL DEFAULT '+91';
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '0000000000';
```

See `QUICK_FIX.md` for detailed troubleshooting.

## 📚 Full Documentation

- **Setup Guide:** See `SETUP_GUIDE.md` for detailed instructions
- **Quick Fix:** See `QUICK_FIX.md` for common issues

## ✨ Features

- ✅ User Registration & Login with validation
- ✅ Email validation (real-time feedback)
- ✅ Password strength (min 8 chars, requires @ or #)
- ✅ Phone number validation with country code
- ✅ SQL to ER Diagram conversion
- ✅ SQL keyword highlighting
- ✅ ER Rules reference table
- ✅ Download ER diagrams as PDF or PNG

## 📁 Project Structure

```
DBMS_PBL/
├── backend/          # Node.js/Express API
├── frontend/         # HTML/CSS/JavaScript UI
├── database/         # SQL schema & migrations
└── package.json      # Root package file
```

## 🛠️ Development

```bash
# Install dependencies
npm run install-deps

# Start backend (production)
npm start

# Start backend (development with auto-reload)
npm run dev
```

## 📝 Notes

- Backend runs on port 5000
- Frontend should run on port 5500 (or any available port)
- Make sure MySQL is running before starting the backend
- Check `.env` file has correct database credentials

## 🐛 Troubleshooting

1. **Database connection error:** Check MySQL is running and `.env` credentials are correct
2. **Port already in use:** Change PORT in `.env` or kill the process using the port
3. **Registration error:** Run the migration SQL (see Quick Fix above)
4. **Module not found:** Run `npm run install-deps` again

For more help, see `SETUP_GUIDE.md` or `QUICK_FIX.md`.
