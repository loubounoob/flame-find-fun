-- Allow everyone to view all flames (for public flame counts)
DROP POLICY IF EXISTS "Users can view their own flames" ON flames;

CREATE POLICY "Anyone can view flames"
ON flames
FOR SELECT
TO authenticated, anon
USING (true);

-- Users can still only create/delete their own flames
-- (existing policies for INSERT and DELETE remain unchanged)