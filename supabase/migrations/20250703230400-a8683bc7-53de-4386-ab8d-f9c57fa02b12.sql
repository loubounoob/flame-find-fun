-- Add daily flame tracking for users
CREATE TABLE public.user_flames_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flame_date DATE NOT NULL DEFAULT CURRENT_DATE,
  offer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, flame_date)
);

-- Enable RLS
ALTER TABLE public.user_flames_daily ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily flames" 
ON public.user_flames_daily 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily flames" 
ON public.user_flames_daily 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily flames" 
ON public.user_flames_daily 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_user_flames_daily_updated_at
BEFORE UPDATE ON public.user_flames_daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_subscribed BOOLEAN NOT NULL DEFAULT false;