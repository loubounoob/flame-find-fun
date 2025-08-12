-- Restrict public access to offer_views and prevent user_id spoofing

-- 1) Drop overly-permissive existing policies
DROP POLICY IF EXISTS "Anyone can view offer views" ON public.offer_views;
DROP POLICY IF EXISTS "Anyone can create offer views" ON public.offer_views;

-- 2) SELECT should be restricted
--    a) Business owners can view views for their own offers
CREATE POLICY "Business can view views for their offers"
ON public.offer_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_views.offer_id
      AND o.business_user_id = auth.uid()
  )
);

--    b) (Optional) Users can view their own view records
CREATE POLICY "Users can view their own offer views"
ON public.offer_views
FOR SELECT
USING (auth.uid() = user_id);

-- 3) INSERT should prevent spoofing user_id
--    a) Allow anonymous view inserts only when user_id is NULL
CREATE POLICY "Anonymous can insert anonymous offer views"
ON public.offer_views
FOR INSERT
WITH CHECK (user_id IS NULL);

--    b) Allow authenticated users to insert rows only for themselves
CREATE POLICY "Users can insert their own offer views"
ON public.offer_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);
