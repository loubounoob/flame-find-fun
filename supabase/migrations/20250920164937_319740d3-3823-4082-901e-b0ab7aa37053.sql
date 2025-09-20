-- Simplification complète - suppression des tables complexes et nettoyage

-- Supprimer les tables de personnalisation de pages
DROP TABLE IF EXISTS business_page_elements CASCADE;
DROP TABLE IF EXISTS business_page_templates CASCADE;
DROP TABLE IF EXISTS business_themes CASCADE;

-- Supprimer les tables de finances et paiements
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS business_finances CASCADE;
DROP TABLE IF EXISTS financial_rate_limits CASCADE;
DROP TABLE IF EXISTS business_revenue_stats CASCADE;
DROP TABLE IF EXISTS stripe_transactions CASCADE;

-- Supprimer les tables de pricing complexe
DROP TABLE IF EXISTS business_pricing CASCADE;
DROP TABLE IF EXISTS business_pricing_rules CASCADE;
DROP TABLE IF EXISTS offer_pricing_options CASCADE;
DROP TABLE IF EXISTS offer_boosts CASCADE;

-- Simplifier la table offers - garder seulement les champs essentiels
ALTER TABLE offers DROP COLUMN IF EXISTS base_price CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS price CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS duration_minutes CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS max_participants CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS min_participants CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS special_conditions CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS equipment_provided CASCADE;
ALTER TABLE offers DROP COLUMN IF EXISTS requirements CASCADE;

-- Agrandir la description pour permettre aux entreprises d'y mettre tous les détails
ALTER TABLE offers ALTER COLUMN description TYPE TEXT;

-- Simplifier la table bookings - supprimer les colonnes de paiement
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_session_id CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_payment_intent_id CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_confirmed CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS total_price CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_time CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS duration_minutes CASCADE;

-- Modifier le statut pour simplifier (confirmed, cancelled)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('confirmed', 'cancelled'));

-- Mettre à jour les bookings existants
UPDATE bookings SET status = 'confirmed' WHERE status IN ('pending_payment', 'paid');

-- Supprimer les fonctions inutiles
DROP FUNCTION IF EXISTS secure_add_earning CASCADE;
DROP FUNCTION IF EXISTS secure_request_withdrawal CASCADE;
DROP FUNCTION IF EXISTS secure_pay_for_boost CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS update_revenue_stats CASCADE;
DROP FUNCTION IF EXISTS calculate_booking_price CASCADE;
DROP FUNCTION IF EXISTS update_booking_price CASCADE;
DROP FUNCTION IF EXISTS audit_financial_transaction CASCADE;

-- Supprimer les triggers liés aux fonctions supprimées
DROP TRIGGER IF EXISTS update_booking_price_trigger ON bookings;
DROP TRIGGER IF EXISTS update_revenue_stats_trigger ON bookings;
DROP TRIGGER IF EXISTS audit_financial_transaction_trigger ON financial_transactions;