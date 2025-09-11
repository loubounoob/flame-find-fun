-- Migration to fix pricing data for existing offers
-- Extract numeric prices from the price field and populate base_price

-- Update base_price for offers that don't have it set but have a price field
UPDATE offers 
SET base_price = CAST(SUBSTRING(price FROM '\d+(?:\.\d+)?') AS NUMERIC)
WHERE base_price IS NULL 
  AND price IS NOT NULL 
  AND price ~ '\d+(?:\.\d+)?'
  AND SUBSTRING(price FROM '\d+(?:\.\d+)?') IS NOT NULL;

-- For offers that still don't have a base_price, set a default based on category
UPDATE offers 
SET base_price = CASE 
  WHEN LOWER(category) LIKE '%bowling%' OR LOWER(category) LIKE '%billard%' THEN 10.0
  WHEN LOWER(category) LIKE '%padel%' OR LOWER(category) LIKE '%tennis%' THEN 25.0
  WHEN LOWER(category) LIKE '%escape%' THEN 30.0
  ELSE 15.0
END
WHERE base_price IS NULL OR base_price = 0;

-- Create default pricing options for offers that don't have any
INSERT INTO offer_pricing_options (offer_id, option_name, price, is_default, description)
SELECT 
  o.id as offer_id,
  CASE 
    WHEN LOWER(o.category) LIKE '%bowling%' OR LOWER(o.category) LIKE '%billard%' THEN 'Prix par partie'
    WHEN LOWER(o.category) LIKE '%padel%' OR LOWER(o.category) LIKE '%tennis%' THEN 'Prix par heure'
    WHEN LOWER(o.category) LIKE '%escape%' THEN 'Prix par session'
    ELSE 'Prix standard'
  END as option_name,
  o.base_price as price,
  true as is_default,
  CASE 
    WHEN LOWER(o.category) LIKE '%bowling%' OR LOWER(o.category) LIKE '%billard%' THEN 'Prix par partie et par joueur'
    WHEN LOWER(o.category) LIKE '%padel%' OR LOWER(o.category) LIKE '%tennis%' THEN 'Prix par heure pour le terrain complet'
    WHEN LOWER(o.category) LIKE '%escape%' THEN 'Prix par session et par participant'
    ELSE 'Prix par participant'
  END as description
FROM offers o
WHERE NOT EXISTS (
  SELECT 1 FROM offer_pricing_options opo 
  WHERE opo.offer_id = o.id
)
AND o.base_price IS NOT NULL 
AND o.base_price > 0;