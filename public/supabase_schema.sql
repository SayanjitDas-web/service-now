-- =========================================================================
-- ServiceNow Platform Simulator - Supabase PostgreSQL Cloud Schema
-- Run this in your Supabase Project: Dashboard > SQL Editor > New Query > Run
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS sn_incidents (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT '1',
  hold_reason TEXT,
  caller_id TEXT NOT NULL,
  category TEXT DEFAULT 'Software',
  subcategory TEXT,
  impact TEXT DEFAULT '3',
  urgency TEXT DEFAULT '3',
  priority TEXT DEFAULT '4',
  assignment_group TEXT,
  assigned_to TEXT,
  cmdb_ci TEXT,
  close_code TEXT,
  close_notes TEXT,
  work_notes TEXT,
  comments TEXT,
  sys_created_on TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_on TIMESTAMPTZ DEFAULT NOW(),
  sys_created_by TEXT DEFAULT 'admin',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  closed_at TIMESTAMPTZ
);

-- 2. PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS sn_problems (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT,
  state TEXT DEFAULT '1',
  priority TEXT DEFAULT '3',
  impact TEXT DEFAULT '3',
  urgency TEXT DEFAULT '3',
  assigned_to TEXT,
  assignment_group TEXT,
  root_cause TEXT,
  workaround TEXT,
  sys_created_on TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_on TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS sn_change_requests (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'Normal',
  state TEXT DEFAULT 'Draft',
  risk TEXT DEFAULT 'Moderate',
  priority TEXT DEFAULT '3',
  impact TEXT DEFAULT '3',
  urgency TEXT DEFAULT '3',
  assigned_to TEXT,
  assignment_group TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  justification TEXT,
  implementation_plan TEXT,
  rollback_plan TEXT,
  test_plan TEXT,
  sys_created_on TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_on TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DATA DICTIONARY TABLES (sys_db_object)
CREATE TABLE IF NOT EXISTS sn_tables (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  super_class TEXT,
  is_custom BOOLEAN DEFAULT false,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  sys_created_on TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENT SCRIPTS (sys_script_client)
CREATE TABLE IF NOT EXISTS sn_client_scripts (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  type TEXT NOT NULL,
  field_name TEXT,
  ui_type TEXT DEFAULT 'All',
  active BOOLEAN DEFAULT true,
  description TEXT,
  script TEXT NOT NULL
);

-- 6. BUSINESS RULES (sys_script)
CREATE TABLE IF NOT EXISTS sn_business_rules (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  when_timing TEXT NOT NULL,
  operation JSONB NOT NULL DEFAULT '{"insert": true, "update": true, "delete": false}'::jsonb,
  filter_field TEXT,
  filter_operator TEXT,
  filter_value TEXT,
  active BOOLEAN DEFAULT true,
  description TEXT,
  script TEXT NOT NULL
);

-- 7. ATTACHMENTS (ImageKit & Local Media Engine)
CREATE TABLE IF NOT EXISTS sn_attachments (
  sys_id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  table_sys_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT NOT NULL,
  imagekit_file_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SERVICE REQUESTS (REQ, RITM, SCTASK)
CREATE TABLE IF NOT EXISTS sn_service_requests (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  ritm_number TEXT NOT NULL UNIQUE,
  sctask_number TEXT NOT NULL,
  catalog_item_id TEXT NOT NULL,
  catalog_item_name TEXT NOT NULL,
  requested_for TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  stage TEXT DEFAULT 'Waiting for Approval',
  state TEXT DEFAULT '1',
  price NUMERIC(10, 2) DEFAULT 0.00,
  variable_responses JSONB DEFAULT '{}'::jsonb,
  sys_created_on TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_on TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ACTIVITY AUDIT STREAM
CREATE TABLE IF NOT EXISTS sn_activity_logs (
  sys_id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
