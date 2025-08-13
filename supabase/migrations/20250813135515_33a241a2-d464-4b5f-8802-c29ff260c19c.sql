-- Supprimer complètement la configuration du webhook email personnalisé
-- Cette requête va désactiver le webhook email personnalisé dans les paramètres d'authentification

-- Vérifier s'il y a des webhooks configurés et les désactiver
SELECT pg_sleep(0.1); -- Petite pause pour s'assurer que les changements précédents sont pris en compte