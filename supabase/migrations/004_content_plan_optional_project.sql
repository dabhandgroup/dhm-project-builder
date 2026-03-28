-- 004_content_plan_optional_project.sql
-- Make project_id optional on content_plans so content can be created without a project

ALTER TABLE content_plans ALTER COLUMN project_id DROP NOT NULL;
