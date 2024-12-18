-- Update product types table to support default and custom types

-- Add is_default column to product_types table
ALTER TABLE product_types ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Insert default product types
INSERT INTO product_types (name, description, is_active, is_default) VALUES
  ('Crown', 'Default crown product type', true, true),
  ('Bridge', 'Default bridge product type', true, true),
  ('Removable', 'Default removable product type', true, true),
  ('Implant', 'Default implant product type', true, true),
  ('Coping', 'Default coping product type', true, true),
  ('Appliance', 'Default appliance product type', true, true)
ON CONFLICT (name) 
DO UPDATE SET 
  is_default = EXCLUDED.is_default,
  description = EXCLUDED.description;

-- Add a check constraint to ensure name uniqueness
ALTER TABLE product_types ADD CONSTRAINT product_types_name_unique UNIQUE (name);

-- Add RLS policies for product types
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON product_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users with proper role" ON product_types
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'lab_admin')
  );

CREATE POLICY "Enable update for authenticated users with proper role" ON product_types
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'lab_admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'lab_admin')
  );