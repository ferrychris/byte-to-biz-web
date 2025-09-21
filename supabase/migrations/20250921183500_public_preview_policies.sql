-- Allow public preview access when a project is marked public
-- RLS policies for website_projects and website_generated_data

-- Ensure RLS is enabled
alter table if exists website_projects enable row level security;
alter table if exists website_generated_data enable row level security;

-- Policy: Authenticated users can read their own projects
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'website_projects' and policyname = 'website_projects_select_own'
  ) then
    create policy website_projects_select_own
    on website_projects for select
    using (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Anonymous (or any user) can read public projects
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'website_projects' and policyname = 'website_projects_select_public'
  ) then
    create policy website_projects_select_public
    on website_projects for select
    using (is_public = true);
  end if;
end $$;

-- Policy: Authenticated users can read generated data for their own projects
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'website_generated_data' and policyname = 'website_generated_data_select_own'
  ) then
    create policy website_generated_data_select_own
    on website_generated_data for select
    using (exists (
      select 1 from website_projects p
      where p.id = website_generated_data.project_id
        and p.user_id = auth.uid()
    ));
  end if;
end $$;

-- Policy: Anyone can read generated data for public projects
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'website_generated_data' and policyname = 'website_generated_data_select_public'
  ) then
    create policy website_generated_data_select_public
    on website_generated_data for select
    using (exists (
      select 1 from website_projects p
      where p.id = website_generated_data.project_id
        and p.is_public = true
    ));
  end if;
end $$;
