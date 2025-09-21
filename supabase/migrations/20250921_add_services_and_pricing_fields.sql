-- Add services and show_pricing fields to website_projects table

ALTER TABLE public.website_projects 
ADD COLUMN services jsonb DEFAULT '[]'::jsonb,
ADD COLUMN show_pricing boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.website_projects.services IS 'Array of service objects with name, description, price, and featured fields';
COMMENT ON COLUMN public.website_projects.show_pricing IS 'Whether to display pricing information on the website';
