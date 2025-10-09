-- Fix RLS policies for business_revenue_stats table
-- Remove the overly permissive "System can manage revenue stats" policy
DROP POLICY IF EXISTS "System can manage revenue stats" ON public.business_revenue_stats;

-- Create separate policies for system operations (INSERT/UPDATE only, not SELECT)
CREATE POLICY "System can insert revenue stats"
ON public.business_revenue_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update revenue stats"
ON public.business_revenue_stats
FOR UPDATE
USING (true);

-- Fix RLS policies for flames table to prevent public exposure of user preferences
DROP POLICY IF EXISTS "Users can view all flames" ON public.flames;

-- Users can only view their own flames
CREATE POLICY "Users can view their own flames"
ON public.flames
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view aggregate flame counts per offer (without user_id exposure)
-- This will be handled through a secure function if needed for public stats