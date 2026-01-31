# Quick Fix for "Server Error" on Registration

## The Problem
The error occurs because the `users` table is missing the `phone_country_code` and `phone_number` columns.

## Quick Solution (Choose One)

### Option 1: Run Migration SQL (Recommended)

1. Open MySQL command line or MySQL Workbench
2. Connect to your MySQL server
3. Run these commands:

```sql
USE ai_er_converter;

ALTER TABLE users 
ADD COLUMN phone_country_code VARCHAR(8) NOT NULL DEFAULT '+91';

ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '0000000000';
```

**Note:** If you get an error saying the column already exists, that's fine - it means the columns are already there.

### Option 2: Recreate Database (If you don't have important data)

1. Open MySQL command line
2. Run:

```sql
DROP DATABASE IF EXISTS ai_er_converter;
CREATE DATABASE ai_er_converter;
USE ai_er_converter;
```

3. Then run the full schema:
   - Copy contents of `database/schema.sql`
   - Paste and execute in MySQL

### Option 3: Check Current Table Structure

First, verify what columns exist:

```sql
USE ai_er_converter;
DESCRIBE users;
```

If you see `phone_country_code` and `phone_number` in the output, the columns exist and the error might be something else.

## After Running Migration

1. Restart your backend server (stop with Ctrl+C, then run `npm start` again)
2. Try registering again
3. The error should be fixed!

## Still Getting Errors?

Check the backend terminal/console for detailed error messages. The improved error handling will now show more specific information about what went wrong.






