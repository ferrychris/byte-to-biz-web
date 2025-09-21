-- Fix job_id constraint in generation_progress table

-- 1) Check if job_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'generation_progress'
      AND column_name  = 'job_id'
  ) THEN
    ALTER TABLE public.generation_progress
      ADD COLUMN job_id uuid;
  END IF;
END;
$$;

-- 2) Backfill job_id with project_id for existing rows
UPDATE public.generation_progress
SET job_id = project_id
WHERE job_id IS NULL;

-- 3) Set NOT NULL constraint
ALTER TABLE public.generation_progress
  ALTER COLUMN job_id SET NOT NULL;

-- 4) Add unique constraint on project_id for latest progress only
-- This ensures we only keep one progress row per project
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'generation_progress_project_id_key'
  ) THEN
    ALTER TABLE public.generation_progress
      ADD CONSTRAINT generation_progress_project_id_key UNIQUE (project_id);
  END IF;
END;
$$;

-- 5) Ensure service role has permissions
GRANT ALL ON public.generation_progress TO service_role;
