-- Migration script to add phone columns to existing users table
-- Run this if your users table already exists without phone columns

USE ai_er_converter;

-- Add phone columns (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- If columns already exist, you'll get an error - that's okay, just ignore it

-- First, add columns with default values
ALTER TABLE users 
ADD COLUMN phone_country_code VARCHAR(8) NOT NULL DEFAULT '+91';

ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '0000000000';

-- Optional: Remove defaults after adding (uncomment if needed)
-- ALTER TABLE users 
-- ALTER COLUMN phone_country_code DROP DEFAULT,
-- ALTER COLUMN phone_number DROP DEFAULT;

