-- Permettre aux utilisateurs de créer des notifications (nécessaire pour les notifications de note)
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Ajouter le trigger pour automatiquement marquer les notifications comme lues après 30 jours
CREATE OR REPLACE FUNCTION public.auto_mark_old_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE notifications 
  SET read = true
  WHERE created_at < NOW() - INTERVAL '30 days' 
    AND read = false;
END;
$$;