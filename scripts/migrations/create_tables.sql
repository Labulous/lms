-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create cases table
create table if not exists cases (
  id uuid default uuid_generate_v4() primary key,
  case_id text not null unique,
  client_id uuid references clients(id),
  doctor_id uuid references doctors(id),
  patient_first_name text not null,
  patient_last_name text not null,
  order_date date not null,
  case_status text not null check (case_status in ('In Queue', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
  delivery_method text not null check (delivery_method in ('Pickup', 'Local Delivery', 'Shipping')),
  due_date date,
  is_due_date_tbd boolean default false,
  appointment_date date,
  appointment_time time,
  working_pan_name text,
  working_pan_color text,
  enclosed_items jsonb default '{"impression": 0, "biteRegistration": 0, "photos": 0, "jig": 0, "opposingModel": 0, "articulator": 0, "returnArticulator": 0, "cadcamFiles": 0, "consultRequested": 0}'::jsonb,
  other_items text,
  lab_notes text,
  technician_notes text,
  lab_id uuid references labs(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create case_files table
create table if not exists case_files (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  storage_path text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create case_products table
create table if not exists case_products (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer default 1,
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create case_product_teeth table
create table if not exists case_product_teeth (
  id uuid default uuid_generate_v4() primary key,
  case_product_id uuid references case_products(id) on delete cascade,
  tooth_number integer not null check (tooth_number between 1 and 32),
  is_range boolean default false,
  shade_data jsonb default '{"occlusal": null, "body": null, "gingival": null, "stump": null}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create case_stages table
create table if not exists case_stages (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade,
  name text not null,
  status text not null check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create case_technicians table
create table if not exists case_technicians (
  case_id uuid references cases(id) on delete cascade,
  technician_id uuid references technicians(id) on delete cascade,
  primary key (case_id, technician_id)
);

-- Create indexes
create index if not exists idx_cases_case_id on cases(case_id);
create index if not exists idx_cases_client_id on cases(client_id);
create index if not exists idx_cases_doctor_id on cases(doctor_id);
create index if not exists idx_cases_lab_id on cases(lab_id);
create index if not exists idx_case_products_case_id on case_products(case_id);
create index if not exists idx_case_product_teeth_case_product_id on case_product_teeth(case_product_id);
create index if not exists idx_case_files_case_id on case_files(case_id);

-- Enable RLS
alter table cases enable row level security;
alter table case_files enable row level security;
alter table case_products enable row level security;
alter table case_product_teeth enable row level security;
alter table case_stages enable row level security;
alter table case_technicians enable row level security;

-- Create RLS policies
create policy "Users can view cases from their lab"
  on cases for select
  using (lab_id = auth.jwt() -> 'lab_id');

create policy "Users can insert cases for their lab"
  on cases for insert
  with check (lab_id = auth.jwt() -> 'lab_id');

create policy "Users can update cases from their lab"
  on cases for update
  using (lab_id = auth.jwt() -> 'lab_id');

create policy "Users can view files from their lab's cases"
  on case_files for select
  using (case_id in (
    select id from cases where lab_id = auth.jwt() -> 'lab_id'
  ));

create policy "Users can insert files for their lab's cases"
  on case_files for insert
  with check (case_id in (
    select id from cases where lab_id = auth.jwt() -> 'lab_id'
  ));
