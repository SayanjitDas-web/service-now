-- ==============================================================================
-- ServiceNow Data Tables Migration (Incidents, Problems, Changes, Requests, Logs)
-- Apply in Supabase Dashboard > SQL Editor > New Query > Run
-- ==============================================================================

-- 1. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incident (
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
  problem_id TEXT,
  parent_incident TEXT,
  change_request_id TEXT,
  close_code TEXT,
  close_notes TEXT,
  work_notes TEXT,
  comments TEXT,
  sys_created_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
  sys_updated_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
  sys_created_by TEXT DEFAULT 'admin',
  resolved_at TEXT,
  resolved_by TEXT,
  closed_at TEXT
);

-- 2. PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS public.problem (
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
  sys_created_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
  sys_updated_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- 3. CHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.change_request (
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
  start_date TEXT,
  end_date TEXT,
  justification TEXT,
  implementation_plan TEXT,
  rollback_plan TEXT,
  test_plan TEXT,
  sys_created_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
  sys_updated_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- 4. SERVICE REQUESTS (sc_req_item)
CREATE TABLE IF NOT EXISTS public.sc_req_item (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  ritm_number TEXT NOT NULL,
  sctask_number TEXT NOT NULL,
  catalog_item_id TEXT NOT NULL,
  catalog_item_name TEXT NOT NULL,
  requested_for TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  assigned_to TEXT,
  assignment_group TEXT,
  short_description TEXT,
  description TEXT,
  stage TEXT DEFAULT 'Waiting for Approval',
  state TEXT DEFAULT '1',
  price NUMERIC(10, 2) DEFAULT 0.00,
  variable_responses JSONB DEFAULT '{}'::jsonb,
  sys_created_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
  sys_updated_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- 5. ACTIVITY LOGS (sys_activity_log)
CREATE TABLE IF NOT EXISTS public.sys_activity_log (
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
  created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- 6. CMDB CONFIGURATION ITEMS
CREATE TABLE IF NOT EXISTS public.cmdb_ci (
  sys_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  status TEXT DEFAULT 'Operational',
  ip_address TEXT,
  mac_address TEXT,
  serial_number TEXT,
  asset_tag TEXT,
  manufacturer TEXT,
  model_id TEXT,
  assigned_to TEXT,
  location TEXT,
  cost NUMERIC(10, 2),
  sys_updated_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- 7. KNOWLEDGE ARTICLES (kb_knowledge)
CREATE TABLE IF NOT EXISTS public.kb_knowledge (
  sys_id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'IT',
  author TEXT,
  views INTEGER DEFAULT 0,
  rating NUMERIC(3, 1) DEFAULT 5.0,
  sys_created_on TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ==============================================================================
-- BACKWARDS COMPATIBILITY VIEWS (sn_ prefix mapping)
-- ==============================================================================
CREATE OR REPLACE VIEW public.sn_incidents AS SELECT * FROM public.incident;
CREATE OR REPLACE VIEW public.sn_problems AS SELECT * FROM public.problem;
CREATE OR REPLACE VIEW public.sn_change_requests AS SELECT * FROM public.change_request;
CREATE OR REPLACE VIEW public.sn_service_requests AS SELECT * FROM public.sc_req_item;
CREATE OR REPLACE VIEW public.sn_activity_logs AS SELECT * FROM public.sys_activity_log;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.incident ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_req_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmdb_ci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_knowledge ENABLE ROW LEVEL SECURITY;

-- incident policies
DROP POLICY IF EXISTS incident_all ON public.incident;
CREATE POLICY incident_all ON public.incident FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- problem policies
DROP POLICY IF EXISTS problem_all ON public.problem;
CREATE POLICY problem_all ON public.problem FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- change_request policies
DROP POLICY IF EXISTS change_request_all ON public.change_request;
CREATE POLICY change_request_all ON public.change_request FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- sc_req_item policies
DROP POLICY IF EXISTS sc_req_item_all ON public.sc_req_item;
CREATE POLICY sc_req_item_all ON public.sc_req_item FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- sys_activity_log policies
DROP POLICY IF EXISTS sys_activity_log_all ON public.sys_activity_log;
CREATE POLICY sys_activity_log_all ON public.sys_activity_log FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- cmdb_ci policies
DROP POLICY IF EXISTS cmdb_ci_all ON public.cmdb_ci;
CREATE POLICY cmdb_ci_all ON public.cmdb_ci FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- kb_knowledge policies
DROP POLICY IF EXISTS kb_knowledge_all ON public.kb_knowledge;
CREATE POLICY kb_knowledge_all ON public.kb_knowledge FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'incident'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incident;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'problem'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.problem;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'change_request'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.change_request;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sc_req_item'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sc_req_item;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sys_activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sys_activity_log;
  END IF;
END $$;
