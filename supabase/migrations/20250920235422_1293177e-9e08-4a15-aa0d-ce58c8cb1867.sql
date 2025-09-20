-- Create enum for website project status
CREATE TYPE public.generation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE public.deployment_status AS ENUM ('pending', 'deploying', 'deployed', 'failed');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_projects table
CREATE TABLE public.website_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_audience TEXT,
  location TEXT,
  status generation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generation_progress table
CREATE TABLE public.generation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.website_projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_page_drafts table
CREATE TABLE public.website_page_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.website_projects(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL,
  content JSONB,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_generated_data table
CREATE TABLE public.website_generated_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.website_projects(id) ON DELETE CASCADE,
  html_content TEXT,
  css_content TEXT,
  js_content TEXT,
  assets_urls JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_deployments table
CREATE TABLE public.website_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.website_projects(id) ON DELETE CASCADE,
  deployment_url TEXT,
  status deployment_status NOT NULL DEFAULT 'pending',
  platform TEXT DEFAULT 'netlify',
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_page_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_generated_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_deployments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for website_projects
CREATE POLICY "Users can view their own projects" 
ON public.website_projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.website_projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.website_projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.website_projects FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for generation_progress
CREATE POLICY "Users can view progress of their projects" 
ON public.generation_progress FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

CREATE POLICY "Users can insert progress for their projects" 
ON public.generation_progress FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

-- Create RLS policies for website_page_drafts
CREATE POLICY "Users can view drafts of their projects" 
ON public.website_page_drafts FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

CREATE POLICY "Users can create drafts for their projects" 
ON public.website_page_drafts FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

-- Create RLS policies for website_generated_data
CREATE POLICY "Users can view generated data of their projects" 
ON public.website_generated_data FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

CREATE POLICY "Users can create generated data for their projects" 
ON public.website_generated_data FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

-- Create RLS policies for website_deployments
CREATE POLICY "Users can view deployments of their projects" 
ON public.website_deployments FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

CREATE POLICY "Users can create deployments for their projects" 
ON public.website_deployments FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.website_projects WHERE id = project_id));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_projects_updated_at
  BEFORE UPDATE ON public.website_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_generated_data_updated_at
  BEFORE UPDATE ON public.website_generated_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();