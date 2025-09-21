-- Add new fields to website_projects table
ALTER TABLE public.website_projects 
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS website_template text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS color_scheme jsonb DEFAULT '{"primary": "#0d6efd", "secondary": "#6c757d", "accent": "#ffc107", "background": "#ffffff", "text": "#212529"}'::jsonb,
ADD COLUMN IF NOT EXISTS typography jsonb DEFAULT '{"headings": "Roboto", "body": "Open Sans"}'::jsonb,
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}'::jsonb;

-- Create website_templates table to store template options
CREATE TABLE IF NOT EXISTS public.website_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  preview_image_url text,
  template_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for website_templates
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read website templates
CREATE POLICY "Anyone can read website templates" 
ON public.website_templates FOR SELECT USING (true);

-- Only allow admins to modify website templates
CREATE POLICY "Only admins can modify website templates" 
ON public.website_templates FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true));

-- Insert default website templates
INSERT INTO public.website_templates (name, description, preview_image_url, template_data)
VALUES 
('Modern Business', 'A clean, modern design for professional businesses', 'https://placehold.co/600x400?text=Modern+Business', '{"layout": "modern", "components": ["hero", "features", "testimonials", "contact"]}'::jsonb),
('Creative Portfolio', 'Showcase your creative work with this artistic template', 'https://placehold.co/600x400?text=Creative+Portfolio', '{"layout": "portfolio", "components": ["gallery", "about", "services", "contact"]}'::jsonb),
('E-commerce Store', 'Perfect for selling products online', 'https://placehold.co/600x400?text=E-commerce', '{"layout": "store", "components": ["products", "categories", "cart", "contact"]}'::jsonb),
('Restaurant', 'Showcase your menu and restaurant information', 'https://placehold.co/600x400?text=Restaurant', '{"layout": "restaurant", "components": ["menu", "about", "gallery", "reservation"]}'::jsonb),
('Professional Services', 'Ideal for consultants and service providers', 'https://placehold.co/600x400?text=Professional', '{"layout": "services", "components": ["services", "team", "process", "contact"]}'::jsonb);

-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
