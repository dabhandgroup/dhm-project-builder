-- Add toggle to include/exclude projects from financial reports
ALTER TABLE projects ADD COLUMN include_in_financials BOOLEAN NOT NULL DEFAULT FALSE;
