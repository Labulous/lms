-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(255) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip_code VARCHAR(255),
    clinic_registration_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table with reference to clients
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users can view their own clients"
    ON clients FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'technician')
    ));

CREATE POLICY "Only admins can insert clients"
    ON clients FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

CREATE POLICY "Only admins can update clients"
    ON clients FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ))
    WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

CREATE POLICY "Only admins can delete clients"
    ON clients FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Policies for doctors table
CREATE POLICY "Users can view their own doctors"
    ON doctors FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'technician')
    ));

CREATE POLICY "Only admins can insert doctors"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

CREATE POLICY "Only admins can update doctors"
    ON doctors FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ))
    WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

CREATE POLICY "Only admins can delete doctors"
    ON doctors FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));
