/**
 * AUTHORIZATION — user -> group -> role -> ACL evaluation.
 *
 * Pure functions (no I/O) so Incident / Problem / Change / Request /
 * Knowledge modules can share one policy engine on client or server.
 * Supabase RLS remains the database-level backstop; this module is the
 * application-level ServiceNow-style ACL check.
 */
import type {
  AclOperation,
  AclResource,
  EffectiveIdentity,
  SysAcl,
  SysGroup,
  SysRole,
} from './types';

export interface AuthzContext {
  effectiveRoleNames: string[];
  groupIds: string[];
  isAdmin: boolean;
}

export function buildAuthzContext(identity: EffectiveIdentity): AuthzContext {
  const names = identity.effectiveRoleNames.map((r) => r.toLowerCase());
  return {
    effectiveRoleNames: names,
    groupIds: identity.groups.map((g) => g.id),
    isAdmin: names.includes('admin') || names.includes('security_admin'),
  };
}

export function buildAuthzContextFromParts(
  directRoles: SysRole[],
  groups: SysGroup[],
  groupRoles: SysRole[]
): AuthzContext {
  const names = Array.from(
    new Set([...directRoles, ...groupRoles].map((r) => r.name.toLowerCase()))
  );
  return {
    effectiveRoleNames: names,
    groupIds: groups.map((g) => g.id),
    isAdmin: names.includes('admin') || names.includes('security_admin'),
  };
}

/** Union of direct + inherited (via group) role names, lowercase + deduped. */
export function effectiveRoleNames(
  directRoles: SysRole[],
  groupRoles: SysRole[]
): string[] {
  return Array.from(
    new Set([...directRoles, ...groupRoles].map((r) => r.name.toLowerCase()))
  );
}

export function hasRole(ctx: AuthzContext, role: string): boolean {
  return ctx.effectiveRoleNames.includes(role.toLowerCase());
}

export function hasAnyRole(ctx: AuthzContext, roles: string[]): boolean {
  const wanted = new Set(roles.map((r) => r.toLowerCase()));
  return ctx.effectiveRoleNames.some((r) => wanted.has(r));
}

export function inGroup(ctx: AuthzContext, groupId: string): boolean {
  return ctx.groupIds.includes(groupId);
}

/**
 * Core ACL check: ALLOW when at least one active ACL row for
 * (resource, operation) is satisfied by the session context.
 *
 * Row semantics (mirrors sys_security_acl):
 * - public row (no role, no group)  -> allow any signed-in session
 * - role row                        -> allow when session has that role
 * - group row                       -> allow when session is a member
 * - admins bypass everything (ServiceNow `admin` override).
 */
export function evaluateAcl(
  ctx: AuthzContext,
  acls: SysAcl[],
  roleById: Map<string, string>,
  resource: AclResource,
  operation: AclOperation
): boolean {
  if (ctx.isAdmin) return true;
  const rows = acls.filter(
    (a) => a.active && a.resource === resource && a.operation === operation
  );
  if (rows.length === 0) return false; // default deny
  return rows.some((row) => {
    if (!row.required_role_id && !row.required_group_id) return true;
    if (row.required_role_id) {
      const roleName = roleById.get(row.required_role_id);
      if (roleName && hasRole(ctx, roleName)) return true;
    }
    if (row.required_group_id && inGroup(ctx, row.required_group_id)) return true;
    return false;
  });
}

/** Convenience wrapper around an EffectiveIdentity. */
export function can(
  identity: EffectiveIdentity,
  roleById: Map<string, string>,
  resource: AclResource,
  operation: AclOperation
): boolean {
  return evaluateAcl(buildAuthzContext(identity), identity.acls, roleById, resource, operation);
}

export function authorizeOrThrow(
  identity: EffectiveIdentity,
  roleById: Map<string, string>,
  resource: AclResource,
  operation: AclOperation
): void {
  if (!can(identity, roleById, resource, operation)) {
    throw new Error(
      `ACL denied: ${operation} on ${resource} requires an additional role. ` +
        `Session roles: [${identity.effectiveRoleNames.join(', ') || 'none'}].`
    );
  }
}

// ---------------------------------------------------------------------------
// Offline fallback policy (used when Supabase is not configured).
// Mirrors the SQL seed so local simulator behavior matches cloud behavior.
// ---------------------------------------------------------------------------
interface FallbackAclRow {
  resource: AclResource;
  operation: AclOperation;
  role: string | null; // null = public
}

export const FALLBACK_ACLS: FallbackAclRow[] = [
  { resource: 'catalog', operation: 'read', role: null },
  { resource: 'kb_knowledge', operation: 'read', role: null },
  ...(['read', 'create', 'update', 'delete'] as AclOperation[]).flatMap((op) => [
    { resource: 'incident' as const, operation: op, role: 'itil' as const },
    { resource: 'incident' as const, operation: op, role: 'admin' as const },
  ]),
  { resource: 'incident', operation: 'read', role: 'end_user' },
  { resource: 'incident', operation: 'create', role: 'end_user' },
  ...(['problem', 'change_request', 'sc_req_item', 'kb_knowledge'] as AclResource[]).flatMap(
    (res) =>
      (['read', 'create', 'update', 'delete'] as AclOperation[]).flatMap((op) => [
        { resource: res, operation: op, role: 'itil' as const },
        { resource: res, operation: op, role: 'admin' as const },
      ])
  ),
  { resource: 'sc_req_item', operation: 'read', role: 'end_user' },
  { resource: 'sc_req_item', operation: 'create', role: 'end_user' },
  { resource: 'problem', operation: 'read', role: 'end_user' },
  { resource: 'change_request', operation: 'read', role: 'end_user' },
  { resource: 'sys_user', operation: 'read', role: 'itil' },
  { resource: 'sys_user', operation: 'read', role: 'admin' },
  { resource: 'sys_user', operation: 'read', role: 'end_user' },
  { resource: 'sys_user', operation: 'create', role: 'admin' },
  { resource: 'sys_user', operation: 'update', role: 'admin' },
  { resource: 'sys_user', operation: 'delete', role: 'admin' },
];

/** Offline equivalent of evaluateAcl using role names directly. */
export function canOffline(
  effectiveRoleNames: string[],
  resource: AclResource,
  operation: AclOperation
): boolean {
  const names = new Set(effectiveRoleNames.map((r) => r.toLowerCase()));
  if (names.has('admin') || names.has('security_admin')) return true;
  return FALLBACK_ACLS.some(
    (row) =>
      row.resource === resource &&
      row.operation === operation &&
      (row.role === null || names.has(row.role))
  );
}
