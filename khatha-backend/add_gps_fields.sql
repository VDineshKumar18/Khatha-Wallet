-- Add GPS location fields to retailers table
-- Run this SQL in your MySQL database before restarting backend

ALTER TABLE retailers 
ADD COLUMN IF NOT EXISTS latitude DOUBLE,
ADD COLUMN IF NOT EXISTS longitude DOUBLE,
ADD COLUMN IF NOT EXISTS delivery_radius_km INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);

-- Verify columns were added
DESCRIBE retailers;
