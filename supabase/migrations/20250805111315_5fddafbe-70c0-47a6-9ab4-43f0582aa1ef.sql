-- Fix storage policies for avatars bucket
-- Create policy for viewing avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Create policy for uploading avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);

-- Create policy for updating avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);

-- Create policy for deleting avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);

-- Create table for saved addresses
CREATE TABLE IF NOT EXISTS public.business_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id uuid NOT NULL,
  address_name text NOT NULL,
  full_address text NOT NULL,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for business_addresses
ALTER TABLE public.business_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for business_addresses
CREATE POLICY "Business users can view their own addresses" 
ON public.business_addresses 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own addresses" 
ON public.business_addresses 
FOR INSERT 
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own addresses" 
ON public.business_addresses 
FOR UPDATE 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own addresses" 
ON public.business_addresses 
FOR DELETE 
USING (auth.uid() = business_user_id);

-- Create trigger for business_addresses timestamps
CREATE TRIGGER update_business_addresses_updated_at
BEFORE UPDATE ON public.business_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();