-- Add locations field to website_projects table for multiple location support

ALTER TABLE public.website_projects 
ADD COLUMN locations jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.website_projects.locations IS 'Array of location objects with address, services, SEO metadata, and business hours for multi-location businesses';
