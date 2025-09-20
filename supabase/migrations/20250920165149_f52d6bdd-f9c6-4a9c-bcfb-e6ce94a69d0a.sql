-- Simplification avec vérification d'existence des tables
DO $$ 
BEGIN
  -- Supprimer les tables de personnalisation si elles existent
  DROP TABLE IF EXISTS business_page_elements CASCADE;
  DROP TABLE IF EXISTS business_page_templates CASCADE; 
  DROP TABLE IF EXISTS business_themes CASCADE;

  -- Supprimer les tables de pricing complexe si elles existent
  DROP TABLE IF EXISTS business_pricing CASCADE;
  DROP TABLE IF EXISTS business_pricing_rules CASCADE;
  DROP TABLE IF EXISTS offer_pricing_options CASCADE;
  DROP TABLE IF EXISTS offer_boosts CASCADE;

  -- Supprimer les tables financières si elles existent
  DROP TABLE IF EXISTS business_finances CASCADE;
  DROP TABLE IF EXISTS financial_rate_limits CASCADE;
  DROP TABLE IF EXISTS business_revenue_stats CASCADE;
  DROP TABLE IF EXISTS stripe_transactions CASCADE;

  -- Simplifier la table offers en supprimant les colonnes de pricing
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'base_price') THEN
    ALTER TABLE offers DROP COLUMN base_price CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'price') THEN
    ALTER TABLE offers DROP COLUMN price CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'duration_minutes') THEN
    ALTER TABLE offers DROP COLUMN duration_minutes CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'max_participants') THEN
    ALTER TABLE offers DROP COLUMN max_participants CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'min_participants') THEN
    ALTER TABLE offers DROP COLUMN min_participants CASCADE;
  END IF;

  -- Simplifier la table bookings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_session_id') THEN
    ALTER TABLE bookings DROP COLUMN stripe_session_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE bookings DROP COLUMN stripe_payment_intent_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_confirmed') THEN
    ALTER TABLE bookings DROP COLUMN payment_confirmed CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_price') THEN
    ALTER TABLE bookings DROP COLUMN total_price CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_time') THEN
    ALTER TABLE bookings DROP COLUMN booking_time CASCADE;
  END IF;

  -- Modifier le constraint de status pour bookings
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('confirmed', 'cancelled'));
  
  -- Mettre à jour les bookings existants
  UPDATE bookings SET status = 'confirmed' WHERE status IN ('pending_payment', 'paid');
  
  -- Agrandir la description pour les offers
  ALTER TABLE offers ALTER COLUMN description TYPE TEXT;

END $$;