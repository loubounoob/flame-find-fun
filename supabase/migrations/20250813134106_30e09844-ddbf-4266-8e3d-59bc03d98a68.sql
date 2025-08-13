-- Créer le bucket avatars pour les photos de profil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Politique pour permettre à tout le monde d'uploader temporairement (avant inscription)
CREATE POLICY "Allow public uploads during signup" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- Politique pour permettre à tout le monde de voir les avatars
CREATE POLICY "Allow public access to avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Politique pour permettre aux utilisateurs connectés de mettre à jour leur avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs connectés de supprimer leur avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);