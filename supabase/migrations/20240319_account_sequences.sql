-- First, temporarily allow NULL values
ALTER TABLE clients ALTER COLUMN account_number DROP NOT NULL;

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS set_account_number ON clients;
DROP FUNCTION IF EXISTS generate_account_number();
DROP FUNCTION IF EXISTS get_next_account_number();
DROP TABLE IF EXISTS account_sequences;
DROP SEQUENCE IF EXISTS client_account_sequence;

-- Create a simple function to get the next available account number
CREATE OR REPLACE FUNCTION get_next_account_number()
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    next_number TEXT;
BEGIN
    -- Get the highest valid account number (between 1000 and 9999)
    SELECT COALESCE(
        (
            SELECT MAX(CAST(account_number AS INTEGER))
            FROM clients
            WHERE account_number ~ '^\d{4}$'
            AND CAST(account_number AS INTEGER) BETWEEN 1000 AND 9999
        ),
        1000
    ) INTO last_number;
    
    RAISE NOTICE 'Current highest account number: %', last_number;
    
    -- Calculate next number
    next_number := LPAD((last_number + 1)::TEXT, 4, '0');
    RAISE NOTICE 'Next account number will be: %', next_number;
    
    RETURN next_number;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_next_account_number: %', SQLERRM;
    RETURN '1001';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_account_number() TO authenticated;

-- Create trigger function
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.account_number := get_next_account_number();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_account_number
    BEFORE INSERT ON clients
    FOR EACH ROW
    WHEN (NEW.account_number IS NULL)
    EXECUTE FUNCTION generate_account_number();

-- Re-add NOT NULL constraint
ALTER TABLE clients ALTER COLUMN account_number SET NOT NULL;
