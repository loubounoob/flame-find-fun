-- Permettre aux entreprises de voir les profils des clients qui ont réservé chez eux
CREATE POLICY "Business users can view profiles of their customers"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.user_id = profiles.user_id
    AND bookings.business_user_id = auth.uid()
  )
);