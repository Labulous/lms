-- Modify clients table to handle auto-generated account numbers
ALTER TABLE clients
    ALTER COLUMN account_number TYPE TEXT,
    ALTER COLUMN account_number SET NOT NULL,
    ADD CONSTRAINT account_number_format CHECK (account_number ~ '^[1-9]\d{3}$');

-- Add unique constraint to account_number
ALTER TABLE clients
    ADD CONSTRAINT unique_account_number UNIQUE (account_number);

-- Add comment to explain the format
COMMENT ON COLUMN clients.account_number IS 'Auto-generated 4-digit number starting from 1001';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_account_number 
    ON clients(account_number);
