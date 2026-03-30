-- Add ai_prompt column to projects for storing custom/edited AI prompts
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
