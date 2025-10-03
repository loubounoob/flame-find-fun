-- Nettoyer les notifications dupliquées existantes
-- Garde seulement la première notification de chaque groupe dupliqué basé sur user_id, type, title, et timestamp proche

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type, title, DATE_TRUNC('second', created_at)
      ORDER BY created_at ASC
    ) as rn
  FROM notifications
  WHERE read = false
)
DELETE FROM notifications
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);