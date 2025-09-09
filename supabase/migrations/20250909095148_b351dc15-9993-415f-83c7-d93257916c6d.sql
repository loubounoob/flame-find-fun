-- Étendre la table business_page_elements pour supporter plus de types
ALTER TABLE business_page_elements 
ADD COLUMN IF NOT EXISTS element_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS theme_colors jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_styles jsonb DEFAULT '{}';

-- Créer une table pour la gestion des médias d'entreprise
CREATE TABLE IF NOT EXISTS business_media_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'logo', 'banner')),
  original_name text,
  file_size integer,
  mime_type text,
  alt_text text,
  tags text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS pour business_media_library
ALTER TABLE business_media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can view their own media library" 
ON business_media_library 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own media library" 
ON business_media_library 
FOR INSERT 
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own media library" 
ON business_media_library 
FOR UPDATE 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own media library" 
ON business_media_library 
FOR DELETE 
USING (auth.uid() = business_user_id);

-- Créer une table pour les thèmes prédéfinis
CREATE TABLE IF NOT EXISTS business_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_name text NOT NULL,
  theme_category text NOT NULL,
  color_palette jsonb NOT NULL,
  typography jsonb NOT NULL,
  layout_config jsonb NOT NULL,
  preview_image_url text,
  is_premium boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insérer des thèmes prédéfinis
INSERT INTO business_themes (theme_name, theme_category, color_palette, typography, layout_config, preview_image_url) VALUES
('Sport Moderne', 'sport', 
  '{"primary": "#ff6b35", "secondary": "#4a90e2", "accent": "#50c878", "neutral": "#f8fafc"}',
  '{"heading": "Inter", "body": "Inter", "sizes": {"h1": "2.5rem", "h2": "2rem", "body": "1rem"}}',
  '{"header": "minimal", "layout": "grid", "spacing": "comfortable"}',
  null
),
('Détente & Spa', 'wellness',
  '{"primary": "#9b59b6", "secondary": "#e67e22", "accent": "#2ecc71", "neutral": "#f4f4f4"}',
  '{"heading": "Playfair Display", "body": "Source Sans Pro", "sizes": {"h1": "2.8rem", "h2": "2.2rem", "body": "1.1rem"}}',
  '{"header": "elegant", "layout": "centered", "spacing": "spacious"}',
  null
),
('Créatif & Artistique', 'creative',
  '{"primary": "#e74c3c", "secondary": "#f39c12", "accent": "#34495e", "neutral": "#ecf0f1"}',
  '{"heading": "Montserrat", "body": "Open Sans", "sizes": {"h1": "2.2rem", "h2": "1.8rem", "body": "0.9rem"}}',
  '{"header": "bold", "layout": "masonry", "spacing": "compact"}',
  null
);

-- RLS pour business_themes (public en lecture)
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view themes" 
ON business_themes 
FOR SELECT 
USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_media_library_updated_at
BEFORE UPDATE ON business_media_library
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();