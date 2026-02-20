-- KHATHA BOOK DATABASE AUDIT SCRIPT
-- RUN THIS IN MYSQL WORKBENCH

-- 1. Check Table Existence
SHOW TABLES;

-- 2. Verify Foreign Keys
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    CONSTRAINT_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA = 'khathabook'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 3. Audit Customer Loyalty and Scheme Fields
DESCRIBE customers;

-- 4. Verify Unique Constraints on Bill Numbers
SHOW INDEX FROM bills WHERE Column_name = 'bill_number';

-- 5. Check for null violations in critical fields
SELECT COUNT(*) FROM bills WHERE retailer_id IS NULL;
SELECT COUNT(*) FROM customers WHERE retailer_id IS NULL;
