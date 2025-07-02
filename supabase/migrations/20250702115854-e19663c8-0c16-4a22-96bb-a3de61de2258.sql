-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  student_status TEXT CHECK (student_status IN ('student', 'business')),
  location TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  flames_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  cover_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_flames INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  location TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  date_available TEXT NOT NULL,
  discount TEXT NOT NULL,
  category TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  flames_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flames table to track user flames
CREATE TABLE public.flames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Businesses policies
CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Business owners can manage their business" ON public.businesses FOR ALL USING (auth.uid()::text = user_id::text);

-- Offers policies
CREATE POLICY "Anyone can view active offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their offers" ON public.offers FOR ALL USING (
  business_id IN (SELECT id FROM public.businesses WHERE user_id::text = auth.uid()::text)
);

-- Flames policies
CREATE POLICY "Users can view all flames" ON public.flames FOR SELECT USING (true);
CREATE POLICY "Users can manage their own flames" ON public.flames FOR ALL USING (auth.uid()::text = user_id::text);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Business owners can view bookings for their offers" ON public.bookings FOR SELECT USING (
  business_id IN (SELECT id FROM public.businesses WHERE user_id::text = auth.uid()::text)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update flame counts
CREATE OR REPLACE FUNCTION public.update_flame_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment flame count for offer
    UPDATE public.offers SET flames_count = flames_count + 1 WHERE id = NEW.offer_id;
    -- Increment total flames for business
    UPDATE public.businesses SET total_flames = total_flames + 1 
    WHERE id = (SELECT business_id FROM public.offers WHERE id = NEW.offer_id);
    -- Increment flames used for user
    UPDATE public.profiles SET flames_used = flames_used + 1 WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement flame count for offer
    UPDATE public.offers SET flames_count = flames_count - 1 WHERE id = OLD.offer_id;
    -- Decrement total flames for business
    UPDATE public.businesses SET total_flames = total_flames - 1 
    WHERE id = (SELECT business_id FROM public.offers WHERE id = OLD.offer_id);
    -- Decrement flames used for user
    UPDATE public.profiles SET flames_used = flames_used - 1 WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flame count updates
CREATE TRIGGER update_flame_counts_trigger
AFTER INSERT OR DELETE ON public.flames
FOR EACH ROW EXECUTE FUNCTION public.update_flame_counts();

-- Insert sample businesses
INSERT INTO public.businesses (user_id, name, description, category, address, phone, website, logo_url, cover_url, rating) VALUES
('00000000-0000-0000-0000-000000000001', 'Strike Zone', 'Le bowling le plus fun de Lyon ! Ambiance décontractée, musique et strikes garantis.', 'Bowling', '15 Rue de la République, 69002 Lyon', '04 78 42 12 34', 'www.strikezone-lyon.fr', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop', 4.5),
('00000000-0000-0000-0000-000000000002', 'Galaxy Arena', 'Laser game nouvelle génération avec effets spéciaux et arènes futuristes.', 'Laser Game', 'Centre Commercial Part-Dieu, 69003 Lyon', '04 78 95 67 89', 'www.galaxyarena.fr', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop', 4.7),
('00000000-0000-0000-0000-000000000003', 'Sing & Dance', 'Karaoké privé avec les derniers hits et système son professionnel.', 'Karaoké', 'Quartier Bellecour, 69002 Lyon', '04 78 37 45 12', 'www.singdance-lyon.com', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', 4.3),
('00000000-0000-0000-0000-000000000004', 'Enigma Room', 'Escape games immersifs avec des décors époustouflants et des énigmes originales.', 'Escape Game', 'Vieux Lyon, 69005 Lyon', '04 78 28 91 56', 'www.enigmaroom.fr', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop', 4.6),
('00000000-0000-0000-0000-000000000005', 'Pool Paradise', 'Billard américain et français dans une ambiance lounge avec snacks et boissons.', 'Billard', 'Presqu''île, 69001 Lyon', '04 78 12 78 90', 'www.poolparadise-lyon.fr', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop', 4.2);

-- Insert sample offers with appropriate media
INSERT INTO public.offers (business_id, title, description, media_url, media_type, location, time_slot, date_available, discount, category, max_capacity, flames_count) VALUES
((SELECT id FROM public.businesses WHERE name = 'Strike Zone'), 'Bowling Party 🎳', '2 heures de bowling + chaussures incluses. Parfait pour s''amuser entre amis après les cours !', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', 'video', '15 Rue de la République, Lyon', '16h00 - 18h00', 'Aujourd''hui', 'Une partie gratuite', 'Bowling', 8, 247),
((SELECT id FROM public.businesses WHERE name = 'Galaxy Arena'), 'Laser Game Epic 🔫', 'Session laser game avec 3 parties incluses. Action et adrénaline garanties !', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop', 'video', 'Centre Commercial Part-Dieu', '14h30 - 16h00', 'Demain', '50% de réduction', 'Laser Game', 12, 189),
((SELECT id FROM public.businesses WHERE name = 'Sing & Dance'), 'Karaoké VIP 🎤', 'Salon privé pour 8 personnes avec boissons incluses. Chante tes hits préférés !', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop', 'image', 'Quartier Bellecour, Lyon', '19h00 - 22h00', 'Vendredi', 'Salon gratuit', 'Karaoké', 8, 156),
((SELECT id FROM public.businesses WHERE name = 'Enigma Room'), 'Escape Game Mystery 🔐', 'Résoudre l''énigme du manoir hanté. Niveau difficile, équipe de 4 à 6 personnes.', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', 'video', 'Vieux Lyon', '15h00 - 16h30', 'Samedi', 'Entrée à 5€', 'Escape Game', 6, 203),
((SELECT id FROM public.businesses WHERE name = 'Pool Paradise'), 'Billard & Snacks 🎱', 'Table de billard réservée pour 2h avec nachos et boissons à volonté.', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', 'image', 'Presqu''île, Lyon', '17h00 - 19h00', 'Dimanche', '2h pour le prix d''1h', 'Billard', 4, 92);