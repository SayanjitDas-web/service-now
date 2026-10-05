/**
 * Client-side identity seeding (idempotent best-effort).
 * The SQL migration is the source of truth; this module only fills gaps
 * when the migration seed was skipped (e.g. tables created empty) and the
 * current session is an admin that passes RLS. All failures are non-fatal.
 */
'use client';

import { getSupabase } from '../supabaseClient';

const ROLE_SEED: Array<{ name: string; description: string }> = [
  { name: 'admin', description: 'System administrator. Full platform access.' },
  { name: 'security_admin', description: 'Elevated security administrator.' },
  { name: 'itil', description: 'ITIL service desk agent.' },
  { name: 'approver', description: 'Can approve changes and requests.' },
  { name: 'end_user', description: 'Self-service portal user.' },
  { name: 'knowledge', description: 'Can author and publish knowledge.' },
];

const GROUP_SEED: Array<{ name: string; description: string; email: string }> = [
  { name: 'Service Desk', description: 'Tier 1/2 triage.', email: 'servicedesk@service-now.simulator' },
  { name: 'Network Engineering', description: 'Network infrastructure.', email: 'network-ops@service-now.simulator' },
  { name: 'Database Administrators', description: 'Database clusters.', email: 'dba-team@service-now.simulator' },
  { name: 'Hardware & Asset Support', description: 'Hardware lifecycle.', email: 'hardware-assets@service-now.simulator' },
  { name: 'Software Applications', description: 'Enterprise apps.', email: 'software-apps@service-now.simulator' },
];

export async function ensureIdentitySeed(): Promise<{ seeded: boolean; reason: string }> {
  const sb = getSupabase();
  if (!sb) return { seeded: false, reason: 'Supabase not configured.' };
  try {
    // Roles
    const { data: existingRoles } = await sb.from('sys_role').select('name');
    const have = new Set(((existingRoles ?? []) as Array<{ name: string }>).map((r) => r.name.toLowerCase()));
    const missingRoles = ROLE_SEED.filter((r) => !have.has(r.name));
    if (missingRoles.length > 0) {
      const { error } = await sb.from('sys_role').insert(missingRoles);
      if (error) return { seeded: false, reason: `role seed blocked by RLS: ${error.message}` };
    }

    // Groups
    const { data: existingGroups } = await sb.from('sys_group').select('name');
    const haveGroups = new Set(
      ((existingGroups ?? []) as Array<{ name: string }>).map((g) => g.name.toLowerCase())
    );
    const missingGroups = GROUP_SEED.filter((g) => !haveGroups.has(g.name.toLowerCase()));
    if (missingGroups.length > 0) {
      const { error } = await sb.from('sys_group').insert(missingGroups);
      if (error) return { seeded: false, reason: `group seed blocked by RLS: ${error.message}` };
    }

    // Group -> itil inheritance
    const { data: roles } = await sb.from('sys_role').select('id,name');
    const { data: groups } = await sb.from('sys_group').select('id,name');
    const itil = ((roles ?? []) as Array<{ id: string; name: string }>).find(
      (r) => r.name.toLowerCase() === 'itil'
    );
    if (itil && groups) {
      const rows = (groups as Array<{ id: string; name: string }>).map((g) => ({
        group_id: g.id,
        role_id: itil.id,
        granted_by: 'seed',
      }));
      if (rows.length > 0) await sb.from('sys_group_role').upsert(rows, { onConflict: 'group_id,role_id' });
    }

    return { seeded: true, reason: 'Identity seed verified.' };
  } catch (e) {
    return { seeded: false, reason: e instanceof Error ? e.message : 'Seed failed.' };
  }
}
