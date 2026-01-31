# Step-by-Step Guide to Run Your Project

## ✅ All Issues Fixed!

1. ✅ **Mermaid syntax error for multiple tables** - Fixed relationship generation
2. ✅ **PDF download error** - Improved Puppeteer error handling
3. ✅ **PNG download** - Now downloads correct diagram based on conversion type
4. ✅ **File upload** - Added JSON/image upload in ER→Table section
5. ✅ **Front page design** - Enhanced with colorful animations

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MySQL Server** (v5.7 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

---

## 🚀 Step-by-Step Instructions

### Step 1: Install Dependencies

Open PowerShell in the project root directory:
```
C:\ER Model genrater\3rd phase DBMS\DBMS_PBL
```

Run:
```powershell
npm run install-deps
```

**Or manually:**
```powershell
cd backend
npm install
cd ..
```

**Wait for installation to complete** (this may take 2-5 minutes)

---

### Step 2: Set Up MySQL Database

1. **Open MySQL Command Line Client** or **MySQL Workbench**

2. **Create the database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS ai_er_converter;
   USE ai_er_converter;
   ```

3. **Create the users table:**
   ```sql
   CREATE TABLE IF NOT EXISTS users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(50) NOT NULL UNIQUE,
       email VARCHAR(100) NOT NULL UNIQUE,
       password_hash VARCHAR(255) NOT NULL,
       phone_country_code VARCHAR(8) NOT NULL,
       phone_number VARCHAR(20) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

   **OR** import the schema file:
   - In MySQL Workbench: File → Run SQL Script → Select `database/schema.sql`
   - In Command Line: `source database/schema.sql;`

---

### Step 3: Create `.env` File

1. **Navigate to:** `backend` folder
2. **Create a new file** named `.env` (no extension)
3. **Add the following content:**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_er_converter
JWT_SECRET=your_super_secret_jwt_key_change_this_to_any_random_string
PORT=5000
```

**Important:**
- Replace `your_mysql_password` with your actual MySQL root password
- If MySQL has no password, use: `DB_PASSWORD=`
- Replace `JWT_SECRET` with any random string (e.g., `my_secret_key_12345`)

**Save the file**

---

### Step 4: Start MySQL Service

1. **Press `Windows + R`** to open Run dialog
2. **Type:** `services.msc` and press Enter
3. **Find "MySQL"** in the list
4. **Right-click** → **Start** (if not running)
5. **Verify** it shows "Running"

---

### Step 5: Start Backend Server

**Open PowerShell** in the project root:

```powershell
npm start
```

**OR:**

```powershell
cd backend
npm start
```

**You should see:**
```
Server running on port 5000
```

**Keep this terminal window open!** ⚠️

---

### Step 6: Start Frontend Server

**Open a NEW PowerShell window** and choose one option:

#### Option A: Using Python (Recommended)
```powershell
cd frontend
python -m http.server 5500
```

#### Option B: Using Node.js http-server
```powershell
npm install -g http-server
cd frontend
http-server -p 5500
```

#### Option C: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"

**Keep this terminal window open too!** ⚠️

---

### Step 7: Access the Application

Open your web browser and go to:

- **Registration Page:** `http://localhost:5500/index.html`
- **Login Page:** `http://localhost:5500/login.html`
- **Dashboard:** `http://localhost:5500/dashboard.html` (after login)

---

## 🎯 Quick Test

1. **Register a new account** on the registration page
2. **Login** with your credentials
3. **Go to Dashboard**
4. **Try converting SQL to ER:**
   - Paste this example SQL:
   ```sql
   CREATE TABLE students (
       student_id INT PRIMARY KEY AUTO_INCREMENT,
       student_name VARCHAR(100) NOT NULL,
       email VARCHAR(100) UNIQUE
   );
   ```
   - Click "Convert to ER"
   - You should see the ER diagram!

---

## 🐛 Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution:**
1. Check your MySQL password in `backend/.env`
2. Verify MySQL service is running
3. Test MySQL connection:
   ```sql
   mysql -u root -p
   ```

### Error: "Cannot connect to database"

**Solution:**
1. Verify MySQL service is running (Step 4)
2. Check `.env` file has correct credentials
3. Verify database exists:
   ```sql
   SHOW DATABASES;
   ```

### Error: "Port 5000 already in use"

**Solution:**
1. Change `PORT=5001` in `backend/.env`
2. Or kill the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <PID_NUMBER> /F
   ```

### Error: "Module not found"

**Solution:**
```powershell
cd backend
npm install
cd ..
```

### Error: "Mermaid syntax error" (for multiple tables)

**Fixed!** The issue has been resolved. If you still see errors:
1. Make sure you're using the latest code
2. Check that table names don't have special characters
3. Verify foreign key relationships are properly defined

### Error: "Error generate PDF"

**Fixed!** The PDF generation has been improved. If you still see errors:
1. Make sure Puppeteer is installed: `cd backend && npm install puppeteer`
2. Wait a few seconds after converting before downloading
3. Check browser console for detailed error messages

---

## 📝 Project Structure

```
DBMS_PBL/
├── backend/              # Node.js/Express API
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic
│   ├── middleware/       # Authentication middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── server.js        # Main server file
│   └── .env             # Environment variables (create this)
├── frontend/            # HTML/CSS/JavaScript UI
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── index.html      # Registration page
│   ├── login.html      # Login page
│   └── dashboard.html  # Main dashboard
├── database/           # SQL schema & migrations
│   ├── schema.sql      # Initial database schema
│   └── migration.sql   # Migration for existing databases
└── package.json        # Root package file
```

---

## ✨ New Features Added

1. **Fixed Mermaid ER Diagram Generation**
   - Now works with multiple tables
   - Proper relationship syntax
   - Sanitized table/column names

2. **Improved PDF Download**
   - Better error handling
   - Longer wait times for rendering
   - More reliable generation

3. **Smart PNG Download**
   - Downloads ER diagram for SQL→ER conversion
   - Downloads table diagram for JSON→Table conversion

4. **File Upload Support**
   - Upload JSON files in ER→Table section
   - Image upload support (with manual input)

5. **Enhanced Front Page**
   - Colorful gradient animations
   - Animated logo and icons
   - Modern, attractive design

---

## 🎉 You're All Set!

Follow these steps in order, and your project should run smoothly. If you encounter any issues, refer to the troubleshooting section above.

**Happy Coding! 🚀**


