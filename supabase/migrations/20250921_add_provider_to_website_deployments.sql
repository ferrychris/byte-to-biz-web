-- Add provider column to website_deployments table
ALTER TABLE website_deployments ADD COLUMN IF NOT EXISTS provider TEXT;
