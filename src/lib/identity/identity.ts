/**
 * IDENTITY SERVICE — sys_user profile + role/group administration.
 *
 * All functions run against Supabase (RLS-enforced). Admin-only writes rely
 * on the sys_user UPDATE / mapping policies (session_is_admin()).
 * Read `fetchFullIdentity` returns the complete EffectiveIdentity for one
 * Supabase Auth user id in a handful of queries so every module shares it.
 */
'use client';

import { requireSupabase, SupabaseNotConfiguredError } from './authentication';
import { effectiveRoleNames } from './authorization';
import type {
  EffectiveIdentity,
  IdentityResult,
  SysAcl,
  SysGroup,
  SysRole,
  SysUser,
} from './types';

export { SupabaseNotConfiguredError };

function err(message: string): IdentityResult<never> {
  return { ok: false, error: message };
}

/** Load the full security context for one Supabase Auth user id. */
export async function fetchFullIdentity(
  authUserId: string
): Promise<IdentityResult<EffectiveIdentity>> {
  let sb;
  try {
    sb = requireSupabase();
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Supabase not configured.');
  }

  const { data: sysUser, error: userError } = await sb
    .from('sys_user')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  // Unlinked Auth account (e.g. invited directly in Supabase): try email match.
  let resolved: SysUser | null = (sysUser as SysUser | null) ?? null;
  if (userError) return err(userError.message);

  if (!resolved) {
    const { data: authInfo } = await sb.auth.getUser();
    const email = authInfo.user?.email;
    if (email) {
      const { data: byEmail } = await sb
        .from('sys_user')
        .select('*')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (byEmail) {
        // Opportunistic link (RLS self-insert/update policy permits own row).
        await sb
          .from('sys_user')
          .update({ auth_user_id: authUserId })
          .eq('id', (byEmail as SysUser).id);
        resolved = { ...(byEmail as SysUser), auth_user_id: authUserId };
      }
    }
  }

  if (!resolved) {
    return err('No sys_user profile is linked to this login. Ask an administrator to provision one.');
  }

  if (!resolved.active) return err('This account is deactivated. Contact your administrator.');
  if (resolved.locked_out) return err('This account is locked. Contact your administrator to unlock it.');

  const [directRolesRes, membershipsRes, aclsRes, rolesRes, groupRolesRes] =
    await Promise.all([
      sb.from('sys_user_role').select('role_id, sys_role!inner(id,name,description,sys_created_on)').eq('user_id', resolved.id),
      sb
        .from('sys_group_member')
        .select('group_id, sys_group!inner(id,name,description,email,manager_id,sys_created_on)')
        .eq('user_id', resolved.id),
      sb.from('sys_acl').select('*').eq('active', true),
      sb.from('sys_role').select('*').order('name'),
      sb.from('sys_group_role').select('group_id, role_id'),
    ]);

  if (directRolesRes.error) return err(directRolesRes.error.message);
  if (membershipsRes.error) return err(membershipsRes.error.message);

  const pickOne = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  const directRoles: SysRole[] = ((directRolesRes.data ?? []) as Array<{ sys_role: SysRole | SysRole[] }>)
    .map((r) => pickOne(r.sys_role))
    .filter((r): r is SysRole => Boolean(r));
  const groups: SysGroup[] = ((membershipsRes.data ?? []) as Array<{ sys_group: SysGroup | SysGroup[] }>)
    .map((m) => pickOne(m.sys_group))
    .filter((g): g is SysGroup => Boolean(g));

  const allRoles: SysRole[] = (rolesRes.data as SysRole[] | null) ?? [];
  const roleById = new Map(allRoles.map((r) => [r.id, r]));
  const memberGroupIds = new Set(groups.map((g) => g.id));
  const inheritedRoleIds = new Set(
    (((groupRolesRes.data ?? []) as Array<{ group_id: string; role_id: string }>) ?? [])
      .filter((gr) => memberGroupIds.has(gr.group_id))
      .map((gr) => gr.role_id)
  );
  const groupRoles: SysRole[] = [...inheritedRoleIds]
    .map((id) => roleById.get(id))
    .filter((r): r is SysRole => Boolean(r));

  return {
    ok: true,
    data: {
      sysUser: resolved,
      directRoles,
      groups,
      groupRoles,
      effectiveRoleNames: effectiveRoleNames(directRoles, groupRoles),
      acls: ((aclsRes.data ?? []) as SysAcl[]) ?? [],
    },
  };
}

/** Directory listing for admin + lookups (RLS: authenticated can read). */
export async function listSysUsers(): Promise<IdentityResult<SysUser[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.from('sys_user').select('*').order('user_name');
    if (error) return err(error.message);
    return { ok: true, data: (data as SysUser[]) ?? [] };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to list users.');
  }
}

export async function listRoles(): Promise<IdentityResult<SysRole[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.from('sys_role').select('*').order('name');
    if (error) return err(error.message);
    return { ok: true, data: (data as SysRole[]) ?? [] };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to list roles.');
  }
}

export async function listGroups(): Promise<IdentityResult<SysGroup[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.from('sys_group').select('*').order('name');
    if (error) return err(error.message);
    return { ok: true, data: (data as SysGroup[]) ?? [] };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to list groups.');
  }
}

export async function listAcls(): Promise<IdentityResult<SysAcl[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_acl')
      .select('*')
      .order('resource')
      .order('operation');
    if (error) return err(error.message);
    return { ok: true, data: (data as SysAcl[]) ?? [] };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to list ACLs.');
  }
}

export async function getUserRoles(userId: string): Promise<IdentityResult<SysRole[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_user_role')
      .select('sys_role!inner(id,name,description,sys_created_on)')
      .eq('user_id', userId);
    if (error) return err(error.message);
    return {
      ok: true,
      data: ((data ?? []) as Array<{ sys_role: SysRole | SysRole[] }>)
        .map((r) => (Array.isArray(r.sys_role) ? r.sys_role[0] : r.sys_role))
        .filter((r): r is SysRole => Boolean(r)),
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load user roles.');
  }
}

export async function getUserGroups(userId: string): Promise<IdentityResult<SysGroup[]>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_group_member')
      .select('sys_group!inner(id,name,description,email,manager_id,sys_created_on)')
      .eq('user_id', userId);
    if (error) return err(error.message);
    return {
      ok: true,
      data: ((data ?? []) as Array<{ sys_group: SysGroup | SysGroup[] }>)
        .map((m) => (Array.isArray(m.sys_group) ? m.sys_group[0] : m.sys_group))
        .filter((g): g is SysGroup => Boolean(g)),
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load user groups.');
  }
}

// ---------------------------------------------------------------------------
// Admin operations (require session_is_admin() under RLS).
// ---------------------------------------------------------------------------
export interface CreateSysUserInput {
  user_name: string;
  email: string;
  first_name: string;
  last_name: string;
  department?: string;
  title?: string;
  phone?: string;
  location?: string;
  auth_user_id?: string | null;
  roleNames?: string[];
  groupIds?: string[];
}

export async function adminCreateSysUser(
  input: CreateSysUserInput
): Promise<IdentityResult<SysUser>> {
  try {
    const sb = requireSupabase();
    const { data: created, error } = await sb
      .from('sys_user')
      .insert({
        user_name: input.user_name.trim(),
        email: input.email.trim(),
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        department: input.department?.trim() || '',
        title: input.title?.trim() || '',
        phone: input.phone?.trim() || '',
        location: input.location?.trim() || '',
        auth_user_id: input.auth_user_id ?? null,
        active: true,
        locked_out: false,
        sys_created_by: 'admin',
      })
      .select('*')
      .single();
    if (error || !created) return err(error?.message ?? 'Failed to create user.');
    const sysUser = created as SysUser;

    // Grant requested roles (names resolved to ids).
    if (input.roleNames && input.roleNames.length > 0) {
      const { data: roles } = await sb.from('sys_role').select('id,name');
      const byName = new Map(((roles ?? []) as SysRole[]).map((r) => [r.name.toLowerCase(), r.id]));
      const rows = input.roleNames
        .map((n) => byName.get(n.toLowerCase()))
        .filter((id): id is string => Boolean(id))
        .map((role_id) => ({ user_id: sysUser.id, role_id, granted_by: 'admin' }));
      if (rows.length > 0) {
        const { error: roleError } = await sb.from('sys_user_role').insert(rows);
        if (roleError) return err(`User created, but role assignment failed: ${roleError.message}`);
      }
    }
    if (input.groupIds && input.groupIds.length > 0) {
      const rows = input.groupIds.map((group_id) => ({
        group_id,
        user_id: sysUser.id,
        added_by: 'admin',
      }));
      const { error: groupError } = await sb.from('sys_group_member').insert(rows);
      if (groupError) return err(`User created, but group assignment failed: ${groupError.message}`);
    }
    return { ok: true, data: sysUser };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to create user.');
  }
}

/** Self-service profile row for a freshly signed-up Auth account. */
export async function createOwnSysUserProfile(input: {
  auth_user_id: string;
  user_name: string;
  email: string;
  first_name: string;
  last_name: string;
}): Promise<IdentityResult<SysUser>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_user')
      .insert({
        auth_user_id: input.auth_user_id,
        user_name: input.user_name.trim(),
        email: input.email.trim(),
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        active: true,
        locked_out: false,
        sys_created_by: 'self-registration',
      })
      .select('*')
      .single();
    if (error || !data) return err(error?.message ?? 'Failed to create profile.');
    const sysUser = data as SysUser;
    // Default grant: end_user role (RLS self-insert is NOT allowed for roles,
    // so this succeeds only when RLS permits; otherwise an admin grants it).
    const { data: endUser } = await sb
      .from('sys_role')
      .select('id')
      .ilike('name', 'end_user')
      .limit(1)
      .maybeSingle();
    if (endUser) {
      await sb.from('sys_user_role').insert({
        user_id: sysUser.id,
        role_id: (endUser as SysRole).id,
        granted_by: 'self-registration',
      });
    }
    return { ok: true, data: sysUser };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to create profile.');
  }
}

export async function adminSetUserActive(
  userId: string,
  active: boolean
): Promise<IdentityResult<SysUser>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_user')
      .update({ active })
      .eq('id', userId)
      .select('*')
      .single();
    if (error || !data) return err(error?.message ?? 'Failed to update user.');
    return { ok: true, data: data as SysUser };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to update user.');
  }
}

export async function adminSetUserLocked(
  userId: string,
  locked: boolean
): Promise<IdentityResult<SysUser>> {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('sys_user')
      .update(locked ? { locked_out: true } : { locked_out: false, failed_login_count: 0 })
      .eq('id', userId)
      .select('*')
      .single();
    if (error || !data) return err(error?.message ?? 'Failed to update lock state.');
    return { ok: true, data: data as SysUser };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to update lock state.');
  }
}

export async function adminGrantRole(userId: string, roleId: string): Promise<IdentityResult<null>> {
  try {
    const sb = requireSupabase();
    const { error } = await sb
      .from('sys_user_role')
      .insert({ user_id: userId, role_id: roleId, granted_by: 'admin' });
    if (error) return err(error.message);
    return { ok: true, data: null };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to grant role.');
  }
}

export async function adminRevokeRole(userId: string, roleId: string): Promise<IdentityResult<null>> {
  try {
    const sb = requireSupabase();
    const { error } = await sb
      .from('sys_user_role')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
    if (error) return err(error.message);
    return { ok: true, data: null };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to revoke role.');
  }
}

export async function adminAddGroupMember(
  groupId: string,
  userId: string
): Promise<IdentityResult<null>> {
  try {
    const sb = requireSupabase();
    const { error } = await sb
      .from('sys_group_member')
      .insert({ group_id: groupId, user_id: userId, added_by: 'admin' });
    if (error) return err(error.message);
    return { ok: true, data: null };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to add group member.');
  }
}

export async function adminRemoveGroupMember(
  groupId: string,
  userId: string
): Promise<IdentityResult<null>> {
  try {
    const sb = requireSupabase();
    const { error } = await sb
      .from('sys_group_member')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return err(error.message);
    return { ok: true, data: null };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to remove group member.');
  }
}
