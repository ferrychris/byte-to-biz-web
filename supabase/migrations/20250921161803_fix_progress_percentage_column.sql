-- Fix progress_percentage column schema cache issue
-- This migration ensures the column is properly recognized by Supabase

-- Drop and recreate the generation_progress table to fix schema cache
DROP TABLE IF EXISTS public.generation_progress CASCADE;

-- Recreate generation_progress table with proper column naming
CREATE TABLE public.generation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.website_projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generation_progress ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for generation_progress
CREATE POLICY "Users can view progress of their projects" 
ON public.generation_progress FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

CREATE POLICY "Users can insert progress for their projects" 
ON public.generation_progress FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

-- Add policy for service role to insert progress (needed for Edge Functions)
CREATE POLICY "Service role can insert progress" 
ON public.generation_progress FOR INSERT 
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.generation_progress TO service_role;
