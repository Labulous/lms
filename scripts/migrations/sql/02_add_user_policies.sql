-- Add RLS policies for auth.users table
create policy "Allow users to view their own user data"
    on auth.users for select
    to authenticated
    using (
        auth.uid() = id
    );

-- Allow admins and technicians to view all user data
create policy "Allow staff to view all user data"
    on auth.users for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );
