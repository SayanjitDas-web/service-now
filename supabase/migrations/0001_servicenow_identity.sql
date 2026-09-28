-- ==============================================================================
-- ServiceNow-style Identity, Authentication & Authorization (Supabase)
-- ==============================================================================
-- Architecture (mirrors ServiceNow):
--   1. IDENTITY      -> public.sys_user  (the sys_user record / profile only.
--                      NO passwords here. Credentials live in auth.users.)
--   2. AUTHENTICATION -> Supabase Auth (auth.users holds email+password hash,
--                      sessions, refresh tokens). sys_user.auth_user_id links
--                      the Auth account to exactly one sys_user profile.
--   3. AUTHORIZATION -> user -> group -> role -> ACL evaluation:
--                      sys_user_role (direct roles)
--                      sys_group_member (user in group)
--                      sys_group_role (group grants roles; inherited by members)
--                      sys_acl (resource + operation -> required role/group)
--
-- Apply in Supabase Dashboard > SQL Editor (run whole file), or via CLI:
--   supabase db push
-- After applying, create Auth users for the demo personas (see ../README.md).
-- ==============================================================================

-- --------------------------------------------------------------------------
-- 0. Helpers
-- --------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.sys_touch_updated_on()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sys_updated_on = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- 1. IDENTITY: sys_user  (ServiceNow sys_user record)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sys_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to Supabase Auth account. NULL until the person first signs up /
  -- first signs in and gets linked by user_name or email match.
  auth_user_id UUID UNIQUE,
  user_name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  locked_out BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  manager_id UUID REFERENCES public.sys_user(id) ON DELETE SET NULL,
  phone TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sys_created_by TEXT NOT NULL DEFAULT 'system',
  sys_updated_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness for login + email (no citext dependency).
CREATE UNIQUE INDEX IF NOT EXISTS sys_user_user_name_lower_uq
  ON public.sys_user (lower(user_name));
CREATE UNIQUE INDEX IF NOT EXISTS sys_user_email_lower_uq
  ON public.sys_user (lower(email));

DROP TRIGGER IF EXISTS trg_sys_user_touch ON public.sys_user;
CREATE TRIGGER trg_sys_user_touch
  BEFORE UPDATE ON public.sys_user
  FOR EACH ROW EXECUTE FUNCTION public.sys_touch_updated_on();

-- --------------------------------------------------------------------------
-- 2. AUTHORIZATION PRIMITIVES: roles, groups, mappings
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sys_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS sys_role_name_lower_uq
  ON public.sys_role (lower(name));

CREATE TABLE IF NOT EXISTS public.sys_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  manager_id UUID REFERENCES public.sys_user(id) ON DELETE SET NULL,
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS sys_group_name_lower_uq
  ON public.sys_group (lower(name));

-- Direct role grants: sys_user -> sys_role  (ServiceNow: sys_user_has_role)
CREATE TABLE IF NOT EXISTS public.sys_user_role (
  user_id UUID NOT NULL REFERENCES public.sys_user(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.sys_role(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL DEFAULT 'system',
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Group membership: sys_user -> sys_group  (ServiceNow: sys_user_grmember)
CREATE TABLE IF NOT EXISTS public.sys_group_member (
  group_id UUID NOT NULL REFERENCES public.sys_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.sys_user(id) ON DELETE CASCADE,
  added_by TEXT NOT NULL DEFAULT 'system',
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Group -> role grants: members inherit these roles
-- (ServiceNow: sys_group_has_role)
CREATE TABLE IF NOT EXISTS public.sys_group_role (
  group_id UUID NOT NULL REFERENCES public.sys_group(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.sys_role(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL DEFAULT 'system',
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, role_id)
);

-- --------------------------------------------------------------------------
-- 3. AUTHORIZATION POLICY: sys_acl  (ServiceNow sys_security_acl)
-- --------------------------------------------------------------------------
-- One row = "to perform <operation> on <resource> the session must satisfy
-- the requirement". A NULL required_role_id + NULL required_group_id row
-- means public (e.g. service portal catalog read).
CREATE TABLE IF NOT EXISTS public.sys_acl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('read', 'create', 'update', 'delete')),
  required_role_id UUID REFERENCES public.sys_role(id) ON DELETE CASCADE,
  required_group_id UUID REFERENCES public.sys_group(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sys_created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sys_acl_requirement_ck CHECK (
    required_role_id IS NOT NULL OR required_group_id IS NOT NULL
    OR resource IN ('catalog', 'kb_knowledge')
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS sys_acl_resource_op_role_group_uq
  ON public.sys_acl (resource, operation, required_role_id, required_group_id);

-- --------------------------------------------------------------------------
-- 4. SECURITY-DEFINER HELPERS (used by RLS, avoid recursion)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_sys_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.sys_user WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Effective role names for the current session (direct + inherited via groups).
CREATE OR REPLACE FUNCTION public.current_effective_roles()
RETURNS TEXT[] AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT r.name), '{}')
  FROM public.sys_role r
  WHERE EXISTS (
      SELECT 1 FROM public.sys_user_role ur
      JOIN public.sys_user u ON u.id = ur.user_id
      WHERE u.auth_user_id = auth.uid() AND ur.role_id = r.id
    )
    OR EXISTS (
      SELECT 1
      FROM public.sys_group_member gm
      JOIN public.sys_user u ON u.id = gm.user_id
      JOIN public.sys_group_role gr ON gr.group_id = gm.group_id
      WHERE u.auth_user_id = auth.uid() AND gr.role_id = r.id
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.session_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT role_name = ANY (public.current_effective_roles());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.session_is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.session_has_role('admin') OR public.session_has_role('security_admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- --------------------------------------------------------------------------
ALTER TABLE public.sys_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_group_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_group_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_acl ENABLE ROW LEVEL SECURITY;

-- -- sys_user ---------------------------------------------------------------
DROP POLICY IF EXISTS sys_user_select_authenticated ON public.sys_user;
CREATE POLICY sys_user_select_authenticated
  ON public.sys_user FOR SELECT TO authenticated
  USING (TRUE);

-- Self-registration: an authenticated session with no sys_user yet may insert
-- exactly one row linked to itself.
DROP POLICY IF EXISTS sys_user_insert_self ON public.sys_user;
CREATE POLICY sys_user_insert_self
  ON public.sys_user FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS sys_user_update_admin ON public.sys_user;
CREATE POLICY sys_user_update_admin
  ON public.sys_user FOR UPDATE TO authenticated
  USING (public.session_is_admin() OR auth_user_id = auth.uid())
  WITH CHECK (public.session_is_admin() OR auth_user_id = auth.uid());

DROP POLICY IF EXISTS sys_user_delete_admin ON public.sys_user;
CREATE POLICY sys_user_delete_admin
  ON public.sys_user FOR DELETE TO authenticated
  USING (public.session_is_admin());

-- -- roles / groups (read for all authenticated, write for admin) -----------
DROP POLICY IF EXISTS sys_role_select_authenticated ON public.sys_role;
CREATE POLICY sys_role_select_authenticated
  ON public.sys_role FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_role_write_admin ON public.sys_role;
CREATE POLICY sys_role_write_admin
  ON public.sys_role FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

DROP POLICY IF EXISTS sys_group_select_authenticated ON public.sys_group;
CREATE POLICY sys_group_select_authenticated
  ON public.sys_group FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_group_write_admin ON public.sys_group;
CREATE POLICY sys_group_write_admin
  ON public.sys_group FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

-- -- mappings ----------------------------------------------------------------
DROP POLICY IF EXISTS sys_user_role_select_authenticated ON public.sys_user_role;
CREATE POLICY sys_user_role_select_authenticated
  ON public.sys_user_role FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_user_role_write_admin ON public.sys_user_role;
CREATE POLICY sys_user_role_write_admin
  ON public.sys_user_role FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

DROP POLICY IF EXISTS sys_group_member_select_authenticated ON public.sys_group_member;
CREATE POLICY sys_group_member_select_authenticated
  ON public.sys_group_member FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_group_member_write_admin ON public.sys_group_member;
CREATE POLICY sys_group_member_write_admin
  ON public.sys_group_member FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

DROP POLICY IF EXISTS sys_group_role_select_authenticated ON public.sys_group_role;
CREATE POLICY sys_group_role_select_authenticated
  ON public.sys_group_role FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_group_role_write_admin ON public.sys_group_role;
CREATE POLICY sys_group_role_write_admin
  ON public.sys_group_role FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

-- -- ACLs (read for all authenticated, write for admin) -----------------------
DROP POLICY IF EXISTS sys_acl_select_authenticated ON public.sys_acl;
CREATE POLICY sys_acl_select_authenticated
  ON public.sys_acl FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS sys_acl_write_admin ON public.sys_acl;
CREATE POLICY sys_acl_write_admin
  ON public.sys_acl FOR ALL TO authenticated
  USING (public.session_is_admin()) WITH CHECK (public.session_is_admin());

-- --------------------------------------------------------------------------
-- 6. SEED: roles
-- --------------------------------------------------------------------------
INSERT INTO public.sys_role (name, description) VALUES
  ('admin', 'System administrator. Full platform access including user administration and impersonation.'),
  ('security_admin', 'Elevated security administrator. User security, ACLs and impersonation.'),
  ('itil', 'ITIL service desk agent. ITSM workflows on Incident, Problem, Change, Request, Knowledge.'),
  ('approver', 'Can approve change requests and catalog requests.'),
  ('end_user', 'Self-service portal user. Catalog, Knowledge, own Requests and Incidents.'),
  ('knowledge', 'Can author and publish knowledge articles.')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 7. SEED: groups (ServiceNow assignment groups)
-- --------------------------------------------------------------------------
INSERT INTO public.sys_group (name, description, email) VALUES
  ('Service Desk', 'Tier 1 and Tier 2 incoming support triage and first-contact resolution.', 'servicedesk@service-now.simulator'),
  ('Network Engineering', 'Routing, switching, corporate WAN/LAN, SD-WAN, and edge VPN infrastructure.', 'network-ops@service-now.simulator'),
  ('Database Administrators', 'Relational and NoSQL clusters, replication, backups, and query performance.', 'dba-team@service-now.simulator'),
  ('Hardware & Asset Support', 'Workstation provisioning, peripheral deployment, and hardware lifecycle.', 'hardware-assets@service-now.simulator'),
  ('Software Applications', 'Enterprise ERP, CRM, development IDEs, and desktop productivity software.', 'software-apps@service-now.simulator')
ON CONFLICT DO NOTHING;

-- Groups grant roles (members inherit): service groups carry the itil role.
INSERT INTO public.sys_group_role (group_id, role_id, granted_by)
SELECT g.id, r.id, 'seed'
FROM public.sys_group g CROSS JOIN public.sys_role r
WHERE r.name = 'itil'
  AND g.name IN ('Service Desk', 'Network Engineering', 'Database Administrators', 'Hardware & Asset Support', 'Software Applications')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 8. SEED: ACLs (resource x operation -> required role)
-- --------------------------------------------------------------------------
-- Public portal reads: no required role/group.
INSERT INTO public.sys_acl (resource, operation, required_role_id, required_group_id, description) VALUES
  ('catalog', 'read', NULL, NULL, 'Service portal catalog is public to signed-in users.'),
  ('kb_knowledge', 'read', NULL, NULL, 'Published knowledge is readable by all signed-in users.')
ON CONFLICT DO NOTHING;

-- Helper: insert role-gated ACL rows idempotently.
-- Incident
INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT 'incident', op, r.id, 'Incident ' || op || ' requires ' || r.name || '.'
FROM (VALUES ('read'), ('create'), ('update'), ('delete')) AS ops(op)
CROSS JOIN public.sys_role r
WHERE r.name IN ('itil', 'admin')
ON CONFLICT DO NOTHING;

-- End users may read/create/update their own incidents via the portal
-- (row ownership is enforced in app logic; the ACL opens the operation).
INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT 'incident', op, r.id, 'Incident portal self-service for end users.'
FROM (VALUES ('read'), ('create')) AS ops(op)
CROSS JOIN public.sys_role r
WHERE r.name = 'end_user'
ON CONFLICT DO NOTHING;

-- Problem / Change / Request / Knowledge authoring
INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT res, op, r.id, res || ' ' || op || ' requires ' || r.name || '.'
FROM (VALUES ('problem'), ('change_request'), ('sc_req_item'), ('kb_knowledge')) AS resources(res)
CROSS JOIN (VALUES ('read'), ('create'), ('update'), ('delete')) AS ops(op)
CROSS JOIN public.sys_role r
WHERE r.name IN ('itil', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT 'sc_req_item', op, r.id, 'Request portal self-service for end users.'
FROM (VALUES ('read'), ('create')) AS ops(op)
CROSS JOIN public.sys_role r
WHERE r.name = 'end_user'
ON CONFLICT DO NOTHING;

-- Identity administration is admin-only (read stays open for lookups).
INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT 'sys_user', op, r.id, 'User administration ' || op || ' requires admin.'
FROM (VALUES ('create'), ('update'), ('delete')) AS ops(op)
CROSS JOIN public.sys_role r
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.sys_acl (resource, operation, required_role_id, description)
SELECT 'sys_user', 'read', r.id, 'User directory readable by staff.'
FROM (VALUES ('itil'), ('admin'), ('end_user')) AS roles(name)
JOIN public.sys_role r ON r.name = roles.name
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 9. SEED: demo sys_user profiles (auth_user_id linked on first sign-in)
-- --------------------------------------------------------------------------
INSERT INTO public.sys_user
  (user_name, email, active, locked_out, first_name, last_name, department, title, phone, location, avatar_url, sys_created_by)
VALUES
  ('admin', 'admin@service-now.simulator', TRUE, FALSE, 'System', 'Administrator', 'Enterprise IT Architecture', 'Lead ServiceNow Platform Architect', '+1 (408) 555-0100', 'Santa Clara HQ - Bldg 1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'seed'),
  ('beth.anglin', 'beth.anglin@service-now.simulator', TRUE, FALSE, 'Beth', 'Anglin', 'IT Service Management', 'Service Desk Lead Manager', '+1 (408) 555-0124', 'San Diego Campus', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'seed'),
  ('david.loo', 'david.loo@service-now.simulator', TRUE, FALSE, 'David', 'Loo', 'Infrastructure Operations', 'Change Advisory Board (CAB) Chair', '+1 (408) 555-0138', 'Santa Clara HQ - Bldg 2', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'seed'),
  ('fred.luddy', 'fred.luddy@service-now.simulator', TRUE, FALSE, 'Fred', 'Luddy', 'Core Platform Engineering', 'Distinguished Engineer & Platform Founder', '+1 (408) 555-0199', 'San Diego Campus', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'seed'),
  ('abel.tuter', 'abel.tuter@service-now.simulator', TRUE, FALSE, 'Abel', 'Tuter', 'Corporate Finance', 'Senior Financial Analyst', '+1 (408) 555-0155', 'New York Financial Center', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 'seed'),
  ('itil.user', 'itil.user@service-now.simulator', TRUE, FALSE, 'ITIL', 'Support Technician', 'Global Service Desk', 'Tier 2 Incident Responder', '+1 (408) 555-0162', 'London Operations Hub', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'seed')
ON CONFLICT DO NOTHING;

-- Direct role grants for the demo personas.
INSERT INTO public.sys_user_role (user_id, role_id, granted_by)
SELECT u.id, r.id, 'seed'
FROM public.sys_user u JOIN public.sys_role r ON (
  (u.user_name = 'admin' AND r.name IN ('admin', 'security_admin', 'itil')) OR
  (u.user_name = 'beth.anglin' AND r.name IN ('itil')) OR
  (u.user_name = 'david.loo' AND r.name IN ('itil', 'approver')) OR
  (u.user_name = 'fred.luddy' AND r.name IN ('admin', 'itil')) OR
  (u.user_name = 'abel.tuter' AND r.name IN ('end_user')) OR
  (u.user_name = 'itil.user' AND r.name IN ('itil'))
)
ON CONFLICT DO NOTHING;

-- Demo group memberships.
INSERT INTO public.sys_group_member (group_id, user_id, added_by)
SELECT g.id, u.id, 'seed'
FROM public.sys_group g JOIN public.sys_user u ON (
  (g.name = 'Service Desk' AND u.user_name IN ('beth.anglin', 'itil.user')) OR
  (g.name = 'Network Engineering' AND u.user_name IN ('david.loo')) OR
  (g.name = 'Database Administrators' AND u.user_name IN ('admin')) OR
  (g.name = 'Hardware & Asset Support' AND u.user_name IN ('beth.anglin')) OR
  (g.name = 'Software Applications' AND u.user_name IN ('fred.luddy'))
)
ON CONFLICT DO NOTHING;

-- Managers for groups.
UPDATE public.sys_group g SET manager_id = u.id
FROM public.sys_user u
WHERE (g.name = 'Service Desk' AND u.user_name = 'beth.anglin')
   OR (g.name = 'Network Engineering' AND u.user_name = 'david.loo')
   OR (g.name = 'Database Administrators' AND u.user_name = 'admin')
   OR (g.name = 'Hardware & Asset Support' AND u.user_name = 'beth.anglin')
   OR (g.name = 'Software Applications' AND u.user_name = 'fred.luddy');
