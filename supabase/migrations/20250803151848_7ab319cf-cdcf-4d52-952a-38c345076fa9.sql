-- Add coordinates fields to offers table if they don't exist
DO $$ 
BEGIN
  -- Check if latitude column doesn't exist and add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='latitude') THEN
    ALTER TABLE offers ADD COLUMN latitude numeric;
  END IF;
  
  -- Check if longitude column doesn't exist and add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='offers' AND column_name='longitude') THEN
    ALTER TABLE offers ADD COLUMN longitude numeric;
  END IF;
END $$;