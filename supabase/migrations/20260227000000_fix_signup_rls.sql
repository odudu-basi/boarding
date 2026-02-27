-- Allow authenticated users to create organizations during signup
-- This fixes the 401 error when signing up

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert their own user record" ON users;

-- Allow any authenticated user to INSERT into organizations (for signup)
CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow any authenticated user to INSERT into users table (for signup)
CREATE POLICY "Users can insert their own user record"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());
