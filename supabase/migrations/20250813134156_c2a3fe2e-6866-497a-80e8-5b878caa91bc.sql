-- Mettre à jour les politiques du bucket avatars pour permettre l'upload public
DROP POLICY IF EXISTS "Allow public uploads during signup" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Politique pour permettre à tout le monde d'uploader dans le bucket avatars
CREATE POLICY "Anyone can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- Politique pour permettre à tout le monde de voir les avatars
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Politique pour permettre aux utilisateurs connectés de mettre à jour leur avatar
CREATE POLICY "Users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');

-- Politique pour permettre aux utilisateurs connectés de supprimer leur avatar
CREATE POLICY "Users can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars');