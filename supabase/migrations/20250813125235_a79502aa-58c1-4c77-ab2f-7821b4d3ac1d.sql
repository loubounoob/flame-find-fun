-- Ajouter les colonnes géographiques et business à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8),
ADD COLUMN address TEXT,
ADD COLUMN business_name TEXT,
ADD COLUMN business_type TEXT,
ADD COLUMN account_type TEXT DEFAULT 'user' CHECK (account_type IN ('user', 'business'));

-- Créer un index pour les recherches géographiques
CREATE INDEX idx_profiles_coordinates ON public.profiles USING btree (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;