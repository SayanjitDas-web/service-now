'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  Lock,
  LockOpen,
  Power,
  RefreshCw,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { getSupabase } from '@/lib/supabaseClient';
import {
  getUserGroups,
  getUserRoles,
  listAcls,
  listGroups,
  listRoles,
  listSysUsers,
  type SysAcl,
  type SysGroup,
  type SysRole,
  type SysUser,
} from '@/lib/identity';

type Tab = 'users' | 'roles' | 'groups' | 'access';

export default function UserAdministration() {
  const {
    isAdmin,
    identitySource,
    authError,
    clearAuthError,
    adminCreateUser,
    adminSetUserActive,
    adminSetUserLocked,
    adminGrantRole,
    adminRevokeRole,
    adminAddGroupMember,
    adminRemoveGroupMember,
  } = usePlatform();

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<SysUser[]>([]);
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [groups, setGroups] = useState<SysGroup[]>([]);
  const [acls, setAcls] = useState<SysAcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<SysRole[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<SysGroup[]>([]);
  const [busy, setBusy] = useState(false);

  // Create-user form
  const [showCreate, setShowCreate] = useState(false);
  const [fUserName, setFUserName] = useState('');
  const [fFirst, setFFirst] = useState('');
  const [fLast, setFLast] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fDept, setFDept] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fRoles, setFRoles] = useState<string[]>(['end_user']);
  const [fGroups, setFGroups] = useState<string[]>([]);

  const supabaseConfigured = Boolean(getSupabase());

  const reload = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [u, r, g, a] = await Promise.all([
        listSysUsers(),
        listRoles(),
        listGroups(),
        listAcls(),
      ]);
      if (u.ok) setUsers(u.data);
      if (r.ok) setRoles(r.data);
      if (g.ok) setGroups(g.data);
      if (a.ok) setAcls(a.data);
    } finally {
      setLoading(false);
    }
  }, [supabaseConfigured]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadSelection = useCallback(async (userId: string) => {
    setSelectedId(userId);
    const [r, g] = await Promise.all([getUserRoles(userId), getUserGroups(userId)]);
    if (r.ok) setSelectedRoles(r.data);
    if (g.ok) setSelectedGroups(g.data);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.user_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [users, search]);

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);
  const groupNameById = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const withBusy = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try {
      const ok = await fn();
      if (ok) await reload();
      if (selectedId) await loadSelection(selectedId);
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
        <ShieldCheck size={36} style={{ margin: '0 auto 12px', color: '#dc2626' }} />
        <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Administrators only</h2>
        <p style={{ fontSize: '13px', color: 'var(--now-text-secondary)', marginTop: '8px' }}>
          User, group, role and ACL administration requires the admin role.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'var(--now-bg-surface)', minHeight: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--now-border)',
          paddingBottom: '14px',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>User Administration (sys_user)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            ServiceNow identity model: user → group → role → ACL.
            Credentials live in Supabase Auth; this console manages the sys_user profile and authorization.
            Source: <strong>{identitySource}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="sn-btn sn-btn-default" onClick={() => void reload()} disabled={busy || loading}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button className="sn-btn sn-btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} />
            <span>New User</span>
          </button>
        </div>
      </div>

      {!supabaseConfigured && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12.5px',
            color: '#92400e',
            marginBottom: '14px',
          }}
        >
          Supabase is not connected, so the identity directory is unavailable. Set
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and apply
          supabase/migrations/0001_servicenow_identity.sql.
        </div>
      )}

      {authError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '12.5px',
            color: '#991b1b',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{authError}</span>
          <button onClick={clearAuthError} style={{ fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      <div className="sn-form-tabs" style={{ marginBottom: '16px' }}>
        {(
          [
            { id: 'users', label: `Users (${users.length})` },
            { id: 'roles', label: `Roles (${roles.length})` },
            { id: 'groups', label: `Groups (${groups.length})` },
            { id: 'access', label: `Access Control (${acls.length})` },
          ] as Array<{ id: Tab; label: string }>
        ).map((t) => (
          <div
            key={t.id}
            className={`sn-form-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'users' && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', minWidth: '320px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--now-border)',
                borderRadius: '6px',
                padding: '6px 10px',
                marginBottom: '10px',
              }}
            >
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search user_name, email, name, department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', marginLeft: '8px', width: '100%', background: 'transparent' }}
              />
            </div>
            <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>Loading directory…</td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => void loadSelection(u.id)}
                      style={{
                        cursor: 'pointer',
                        background: selectedId === u.id ? '#e6f7f4' : undefined,
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{u.user_name}</td>
                      <td>
                        {u.first_name} {u.last_name}
                        <div style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: !u.active ? '#f1f5f9' : u.locked_out ? '#fee2e2' : '#dcfce7',
                            color: !u.active ? '#475569' : u.locked_out ? '#b91c1c' : '#15803d',
                          }}
                        >
                          {!u.active ? 'Inactive' : u.locked_out ? 'Locked' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              flex: '1 1 320px',
              minWidth: '300px',
              border: '1px solid var(--now-border)',
              borderRadius: '8px',
              padding: '16px',
              background: 'var(--now-bg-surface-alt)',
              alignSelf: 'flex-start',
            }}
          >
            {!selected ? (
              <p style={{ fontSize: '12.5px', color: 'var(--now-text-muted)' }}>
                Select a user to manage activation, lockout, roles and groups.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {selected.first_name} {selected.last_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>
                    {selected.user_name} • {selected.email}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>
                    {selected.title} • {selected.department}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="sn-btn sn-btn-default"
                    disabled={busy}
                    onClick={() => void withBusy(() => adminSetUserActive(selected.id, !selected.active))}
                  >
                    <Power size={13} />
                    <span>{selected.active ? 'Deactivate' : 'Activate'}</span>
                  </button>
                  <button
                    className="sn-btn sn-btn-default"
                    disabled={busy}
                    onClick={() => void withBusy(() => adminSetUserLocked(selected.id, !selected.locked_out))}
                  >
                    {selected.locked_out ? <LockOpen size={13} /> : <Lock size={13} />}
                    <span>{selected.locked_out ? 'Unlock' : 'Lock'}</span>
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Direct roles (sys_user_role)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {selectedRoles.map((r) => (
                      <span
                        key={r.id}
                        style={{
                          fontSize: '11.5px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {r.name}{' '}
                        <button
                          disabled={busy}
                          onClick={() => void withBusy(() => adminRevokeRole(selected.id, r.id))}
                          title={`Revoke ${r.name}`}
                          style={{ marginLeft: '4px', fontWeight: 800 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {selectedRoles.length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>No direct roles.</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      id="grant-role"
                      className="sn-filter-select"
                      onChange={(e) => {
                        const roleId = e.target.value;
                        if (roleId) void withBusy(() => adminGrantRole(selected.id, roleId));
                        e.target.value = '';
                      }}
                      defaultValue=""
                    >
                      <option value="">Grant role…</option>
                      {roles
                        .filter((r) => !selectedRoles.some((s) => s.id === r.id))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Groups (sys_user_grmember)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {selectedGroups.map((g) => (
                      <span
                        key={g.id}
                        style={{
                          fontSize: '11.5px',
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {g.name}{' '}
                        <button
                          disabled={busy}
                          onClick={() => void withBusy(() => adminRemoveGroupMember(g.id, selected.id))}
                          title={`Remove from ${g.name}`}
                          style={{ marginLeft: '4px', fontWeight: 800 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {selectedGroups.length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>No groups.</span>
                    )}
                  </div>
                  <select
                    className="sn-filter-select"
                    onChange={(e) => {
                      const groupId = e.target.value;
                      if (groupId) void withBusy(() => adminAddGroupMember(groupId, selected.id));
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="">Add to group…</option>
                    {groups
                      .filter((g) => !selectedGroups.some((s) => s.id === g.id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
          <thead>
            <tr>
              <th>Role (sys_role)</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td>{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'groups' && (
        <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
          <thead>
            <tr>
              <th>Group (sys_user_group)</th>
              <th>Description</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td style={{ fontWeight: 700 }}>{g.name}</td>
                <td>{g.description}</td>
                <td>{g.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'access' && (
        <div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginBottom: '10px' }}>
            Each row grants one (resource, operation) to holders of a role or members of a group.
            Rows with no role/group are public to signed-in users. Admins bypass all rows.
          </p>
          <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Operation</th>
                <th>Requires role</th>
                <th>Requires group</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {acls.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.resource}</td>
                  <td>{a.operation}</td>
                  <td>{a.required_role_id ? roleNameById.get(a.required_role_id) ?? '—' : 'public'}</td>
                  <td>{a.required_group_id ? groupNameById.get(a.required_group_id) ?? '—' : '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--now-text-secondary)' }}>{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="sn-modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="sn-modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sn-modal-header">
              <span>Create sys_user + Auth account</span>
              <button onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="sn-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className="sn-field-input" placeholder="User ID (user_name)" value={fUserName} onChange={(e) => setFUserName(e.target.value)} />
                <input className="sn-field-input" placeholder="Email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
                <input className="sn-field-input" placeholder="First name" value={fFirst} onChange={(e) => setFFirst(e.target.value)} />
                <input className="sn-field-input" placeholder="Last name" value={fLast} onChange={(e) => setFLast(e.target.value)} />
                <input className="sn-field-input" placeholder="Department" value={fDept} onChange={(e) => setFDept(e.target.value)} />
                <input className="sn-field-input" placeholder="Title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
              </div>
              <input
                className="sn-field-input"
                type="password"
                placeholder="Temporary password (min 8, upper + lower + number)"
                value={fPassword}
                onChange={(e) => setFPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Roles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roles.map((r) => (
                    <label key={r.id} style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={fRoles.includes(r.name)}
                        onChange={(e) =>
                          setFRoles((prev) =>
                            e.target.checked ? [...prev, r.name] : prev.filter((x) => x !== r.name)
                          )
                        }
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Groups</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {groups.map((g) => (
                    <label key={g.id} style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={fGroups.includes(g.id)}
                        onChange={(e) =>
                          setFGroups((prev) =>
                            e.target.checked ? [...prev, g.id] : prev.filter((x) => x !== g.id)
                          )
                        }
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="sn-modal-footer">
              <button className="sn-btn sn-btn-default" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="sn-btn sn-btn-primary"
                disabled={busy}
                onClick={() =>
                  void withBusy(async () => {
                    const ok = await adminCreateUser({
                      user_name: fUserName,
                      email: fEmail,
                      first_name: fFirst,
                      last_name: fLast,
                      password: fPassword,
                      department: fDept,
                      title: fTitle,
                      roleNames: fRoles,
                      groupIds: fGroups,
                    });
                    if (ok) {
                      setShowCreate(false);
                      setFUserName('');
                      setFFirst('');
                      setFLast('');
                      setFEmail('');
                      setFPassword('');
                      setFDept('');
                      setFTitle('');
                      setFRoles(['end_user']);
                      setFGroups([]);
                    }
                    return ok;
                  })
                }
              >
                Create user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
