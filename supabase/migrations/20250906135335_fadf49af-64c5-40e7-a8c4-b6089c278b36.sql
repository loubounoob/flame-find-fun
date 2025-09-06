-- Create business page templates system
CREATE TABLE public.business_page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  template_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business page elements
CREATE TABLE public.business_page_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.business_page_templates(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL, -- 'hero', 'pricing', 'gallery', 'testimonials', 'cta', 'form'
  element_config JSONB NOT NULL DEFAULT '{}',
  position_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_page_elements ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Business users can manage their own templates" 
ON public.business_page_templates 
FOR ALL 
USING (auth.uid() = business_user_id);

CREATE POLICY "Anyone can view active templates" 
ON public.business_page_templates 
FOR SELECT 
USING (is_active = true);

-- Create policies for elements
CREATE POLICY "Business users can manage elements for their templates" 
ON public.business_page_elements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.business_page_templates 
  WHERE id = business_page_elements.template_id 
  AND business_user_id = auth.uid()
));

CREATE POLICY "Anyone can view elements of active templates" 
ON public.business_page_elements 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.business_page_templates 
  WHERE id = business_page_elements.template_id 
  AND is_active = true
));

-- Create triggers for updated_at
CREATE TRIGGER update_business_page_templates_updated_at
BEFORE UPDATE ON public.business_page_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_page_elements_updated_at
BEFORE UPDATE ON public.business_page_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();