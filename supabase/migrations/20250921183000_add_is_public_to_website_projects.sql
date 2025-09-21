-- Add is_public column to website_projects to support public/private visibility
alter table website_projects
add column if not exists is_public boolean not null default false;

-- Optional: create an index if you plan to filter often by visibility
create index if not exists website_projects_is_public_idx on website_projects (is_public);
