-- Create enum types for materials, product types, and billing types
DO $$
BEGIN
  -- Create material_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_type') THEN
    CREATE TYPE material_type AS ENUM (
      'Acrylic',
      'Denture',
      'E.Max',
      'Full Cast',
      'PFM',
      'Zirconia'
    );
  END IF;

  -- Create product_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
    CREATE TYPE product_type AS ENUM (
      'Crown',
      'Bridge',
      'Removable',
      'Implant',
      'Coping',
      'Appliance'
    );
  END IF;

  -- Create billing_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_type') THEN
    CREATE TYPE billing_type AS ENUM (
      'perTooth',
      'perArch',
      'teeth',
      'generic',
      'calculate',
      'per_unit'
    );
  END IF;
END$$;

-- Create materials reference table
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name material_type NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product_types reference table
CREATE TABLE IF NOT EXISTS product_types (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name product_type NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create billing_types reference table
CREATE TABLE IF NOT EXISTS billing_types (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name billing_type NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create shade_options reference table
CREATE TABLE IF NOT EXISTS shade_options (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'VITA Classical'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial material types
INSERT INTO materials (name, description)
VALUES 
  ('Acrylic', 'Acrylic material for dental prosthetics'),
  ('Denture', 'Material used for dentures'),
  ('E.Max', 'E.max ceramic material'),
  ('Full Cast', 'Full cast metal material'),
  ('PFM', 'Porcelain Fused to Metal'),
  ('Zirconia', 'Zirconia ceramic material')
ON CONFLICT (name) DO NOTHING;

-- Insert initial product types
INSERT INTO product_types (name, description)
VALUES 
  ('Crown', 'Dental crown prosthetic'),
  ('Bridge', 'Dental bridge prosthetic'),
  ('Removable', 'Removable dental prosthetic'),
  ('Implant', 'Dental implant prosthetic'),
  ('Coping', 'Dental coping'),
  ('Appliance', 'Dental appliance')
ON CONFLICT (name) DO NOTHING;

-- Insert billing types
INSERT INTO billing_types (name, label, description)
VALUES 
  ('perTooth', 'Per Tooth', 'Price calculated per tooth (e.g., crowns and bridges)'),
  ('perArch', 'Per Arch', 'Price calculated per dental arch'),
  ('teeth', 'Teeth', 'Selection without charging per tooth'),
  ('generic', 'Generic', 'No specific teeth selection required'),
  ('calculate', 'Calculate', 'Price calculation based on entered amount'),
  ('per_unit', 'Per Unit', 'Price calculated per unit')
ON CONFLICT (name) DO NOTHING;

-- Insert VITA Classical shades
INSERT INTO shade_options (name, category)
VALUES 
  ('A1', 'VITA Classical'),
  ('A2', 'VITA Classical'),
  ('A2.5', 'VITA Classical'),
  ('A3', 'VITA Classical'),
  ('A3.5', 'VITA Classical'),
  ('A4', 'VITA Classical'),
  ('B1', 'VITA Classical'),
  ('B1.5', 'VITA Classical'),
  ('B2', 'VITA Classical'),
  ('B3', 'VITA Classical'),
  ('B4', 'VITA Classical'),
  ('C1', 'VITA Classical'),
  ('C1.5', 'VITA Classical'),
  ('C2', 'VITA Classical'),
  ('C3', 'VITA Classical'),
  ('C4', 'VITA Classical'),
  ('D2', 'VITA Classical'),
  ('D3', 'VITA Classical'),
  ('D4', 'VITA Classical')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shade_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view reference data
CREATE POLICY "Allow authenticated users to view materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view product types"
  ON product_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view billing types"
  ON billing_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view shade options"
  ON shade_options FOR SELECT
  TO authenticated
  USING (true);
