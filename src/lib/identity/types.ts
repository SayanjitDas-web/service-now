/**
 * ServiceNow-style Identity model (Supabase-backed).
 *
 * Separation of concerns (mirrors ServiceNow):
 * - IDENTITY:       SysUser / SysRole / SysGroup (+ membership/grant tables).
 *                   Profile data only. NEVER stores passwords.
 * - AUTHENTICATION: Supabase Auth (auth.users). Holds credentials + sessions.
 *                   Linked via SysUser.auth_user_id.
 * - AUTHORIZATION:  user -> group -> role -> ACL evaluation over
 *                   (resource, operation). See authorization.ts.
 *
 * Future modules (Incident, Problem, Change, Request, Knowledge) consume
 * `EffectiveIdentity` + `can()` and never touch passwords or sessions.
 */

/** Legacy UI role union (kept for existing components). */
export type LegacyRole = 'admin' | 'itil' | 'security_admin' | 'approver' | 'end_user';

/** Canonical ServiceNow-style user record (public.sys_user). */
export interface SysUser {
  id: string;
  auth_user_id: string | null;
  user_name: string;
  email: string;
  active: boolean;
  locked_out: boolean;
  failed_login_count: number;
  last_login_at: string | null;
  first_name: string;
  last_name: string;
  department: string;
  title: string;
  manager_id: string | null;
  phone: string;
  location: string;
  avatar_url: string;
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
}

export interface SysRole {
  id: string;
  name: string;
  description: string;
  sys_created_on: string;
}

export interface SysGroup {
  id: string;
  name: string;
  description: string;
  email: string;
  manager_id: string | null;
  sys_created_on: string;
}

export interface SysUserRole {
  user_id: string;
  role_id: string;
  granted_by: string;
  sys_created_on: string;
}

export interface SysGroupMember {
  group_id: string;
  user_id: string;
  added_by: string;
  sys_created_on: string;
}

export interface SysGroupRole {
  group_id: string;
  role_id: string;
  granted_by: string;
  sys_created_on: string;
}

/** ITSM resources governed by ACLs. Extend as new modules land. */
export type AclResource =
  | 'incident'
  | 'problem'
  | 'change_request'
  | 'sc_req_item'
  | 'kb_knowledge'
  | 'catalog'
  | 'sys_user'
  | 'sys_group'
  | 'sys_role'
  | 'sys_acl';

export type AclOperation = 'read' | 'create' | 'update' | 'delete';

export interface SysAcl {
  id: string;
  resource: AclResource;
  operation: AclOperation;
  /** Required role id; NULL = no role requirement for this row. */
  required_role_id: string | null;
  /** Required group id; NULL = no group requirement for this row. */
  required_group_id: string | null;
  description: string;
  active: boolean;
  sys_created_on: string;
}

/**
 * Resolved security context for one session:
 * identity + direct roles + groups + inherited roles + effective set + ACLs.
 */
export interface EffectiveIdentity {
  sysUser: SysUser;
  directRoles: SysRole[];
  groups: SysGroup[];
  groupRoles: SysRole[];
  /** Union of direct + inherited role names (lowercase canonical). */
  effectiveRoleNames: string[];
  acls: SysAcl[];
}

export type IdentityResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Display name helper (ServiceNow shows "First Last"). */
export function sysUserDisplayName(u: Pick<SysUser, 'first_name' | 'last_name' | 'user_name'>): string {
  const full = `${u.first_name} ${u.last_name}`.trim();
  return full || u.user_name;
}

/**
 * Map a SysUser + effective role names onto the legacy UI `User` shape so
 * existing components (header, nav, lists, g_form) keep working unchanged.
 */
export function toLegacyUser(
  sysUser: SysUser,
  effectiveRoleNames: string[]
): {
  sys_id: string;
  user_name: string;
  name: string;
  email: string;
  roles: LegacyRole[];
  avatar?: string;
  title: string;
  department: string;
  phone?: string;
  location?: string;
} {
  const known: LegacyRole[] = ['admin', 'itil', 'security_admin', 'approver', 'end_user'];
  const roles = effectiveRoleNames
    .map((r) => r.toLowerCase() as LegacyRole)
    .filter((r) => known.includes(r));
  return {
    sys_id: sysUser.id,
    user_name: sysUser.user_name,
    name: sysUserDisplayName(sysUser),
    email: sysUser.email,
    roles: roles.length > 0 ? roles : ['end_user'],
    avatar: sysUser.avatar_url || undefined,
    title: sysUser.title,
    department: sysUser.department,
    phone: sysUser.phone || undefined,
    location: sysUser.location || undefined,
  };
}

/** Split "Full Name" into ServiceNow first/last parts. */
export function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}
