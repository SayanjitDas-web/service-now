import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage config
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('sn_supabase_url');
    const storedKey = localStorage.getItem('sn_supabase_anon_key');
    if (storedUrl && storedKey) {
      return { url: storedUrl, anonKey: storedKey, isConfigured: true };
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('placeholder')) {
    return { url: envUrl, anonKey: envKey, isConfigured: true };
  }

  return { url: '', anonKey: '', isConfigured: false };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = null;
}

export const SUPABASE_SQL_SCHEMA = `-- ServiceNow Platform Simulator - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to enable full cloud persistence!

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
  sys_created_by TEXT DEFAULT 'admin'
);

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

CREATE TABLE IF NOT EXISTS sn_change_requests (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'Normal',
  state TEXT DEFAULT 'Draft',
  risk TEXT DEFAULT 'Moderate',
  priority TEXT DEFAULT '3',
  assigned_to TEXT,
  assignment_group TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  justification TEXT,
  implementation_plan TEXT,
  rollback_plan TEXT,
  sys_created_on TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sn_tables (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  super_class TEXT,
  is_custom BOOLEAN DEFAULT false,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  sys_created_on TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS sn_business_rules (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  when_timing TEXT NOT NULL,
  operations JSONB NOT NULL DEFAULT '{"insert": true, "update": true, "delete": false}'::jsonb,
  active BOOLEAN DEFAULT true,
  description TEXT,
  script TEXT NOT NULL
);

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
`;
