-- Supprimer temporairement le webhook personnalisé qui cause l'erreur
DROP FUNCTION IF EXISTS public.send_custom_auth_email() CASCADE;

-- Supprimer le trigger qui appelle cette fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;