-- Database initialization script for PostgreSQL
-- Sets timezone and creates extensions

-- Set timezone to Asia/Seoul
SET timezone = 'Asia/Seoul';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Show current timezone setting
SELECT current_setting('TIMEZONE') as current_timezone;