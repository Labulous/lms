-- Create sequence for case numbers
create sequence if not exists case_number_seq;

-- Function to generate checksum (Luhn algorithm)
create or replace function public.calculate_checksum(input text)
returns char as $$
declare
    sum integer := 0;
    digit integer;
    i integer;
    len integer;
begin
    len := length(input);
    for i in 1..len loop
        digit := (ascii(substr(input, i, 1)) - 48);  -- Convert char to number
        if i % 2 = 0 then
            digit := digit * 2;
            if digit > 9 then
                digit := digit - 9;
            end if;
        end if;
        sum := sum + digit;
    end loop;
    return chr(((10 - (sum % 10)) % 10) + 48);  -- Convert number back to char
end;
$$ language plpgsql immutable;

-- Function to generate QR code
create or replace function public.generate_case_qr_code(lab_id text default 'LAB1')
returns text as $$
declare
    year_month text;
    sequence_number text;
    base_code text;
    check_digit char;
begin
    -- Get current year and month (YYMM format)
    year_month := to_char(current_timestamp, 'YYMM');
    
    -- Get next sequence number, padded to 4 digits
    sequence_number := lpad(nextval('case_number_seq')::text, 4, '0');
    
    -- Combine parts (LAB1-2401-0001)
    base_code := lab_id || '-' || year_month || '-' || sequence_number;
    
    -- Calculate checksum
    check_digit := public.calculate_checksum(replace(base_code, '-', ''));
    
    -- Return complete QR code
    return base_code || check_digit;
end;
$$ language plpgsql;

-- Function to validate QR code format and checksum
create or replace function public.is_valid_qr_code(qr_code text)
returns boolean as $$
declare
    parts text[];
    base_code text;
    provided_check_digit char;
    calculated_check_digit char;
begin
    -- Check basic format (e.g., LAB1-2401-0001X)
    if qr_code !~ '^[A-Z0-9]{3,4}-[0-9]{4}-[0-9]{4}[0-9]$' then
        return false;
    end if;
    
    -- Split into base code and check digit
    base_code := substr(qr_code, 1, length(qr_code)-1);
    provided_check_digit := substr(qr_code, length(qr_code), 1);
    
    -- Calculate and compare checksum
    calculated_check_digit := public.calculate_checksum(replace(base_code, '-', ''));
    
    return provided_check_digit = calculated_check_digit;
end;
$$ language plpgsql immutable;

-- Add trigger to automatically generate QR code for new cases
create or replace function public.set_case_qr_code()
returns trigger as $$
begin
    if NEW.qr_code is null then
        NEW.qr_code := public.generate_case_qr_code();
    elsif not public.is_valid_qr_code(NEW.qr_code) then
        raise exception 'Invalid QR code format';
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Create trigger
create trigger generate_case_qr_code
    before insert on public.cases
    for each row
    execute function public.set_case_qr_code();

-- Example of how to manually generate a QR code:
-- select public.generate_case_qr_code();  -- Returns something like: LAB1-2401-00015

-- Example of how to validate a QR code:
-- select public.is_valid_qr_code('LAB1-2401-00015');  -- Returns true/false
