'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  User,
  Group,
  ConfigurationItem,
  Incident,
  Problem,
  ChangeRequest,
  CatalogItem,
  ServiceRequest,
  KnowledgeArticle,
  TableDefinition,
  ClientScript,
  BusinessRule,
  FlowDefinition,
  UpdateSet,
  ActivityLog,
  Attachment,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_GROUPS,
  INITIAL_CIS,
  INITIAL_INCIDENTS,
  INITIAL_PROBLEMS,
  INITIAL_CHANGES,
  INITIAL_CATALOG_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_KNOWLEDGE,
  INITIAL_TABLES,
  INITIAL_CLIENT_SCRIPTS,
  INITIAL_BUSINESS_RULES,
  INITIAL_FLOWS,
  INITIAL_UPDATE_SETS,
  INITIAL_ACTIVITY_LOGS,
} from './initialData';
import { getSupabase } from './supabaseClient';
import {
  hashPassword,
  loadCredentials,
  loadCustomUsers,
  loadSessionUserName,
  saveCredentials,
  saveCustomUsers,
  saveSession,
  seedDefaultCredentials,
  userCanAccessView,
  userIsAdmin,
  validatePasswordStrength,
  validateUserName,
} from './authUtils';
import {
  adminAddGroupMember as svcAddGroupMember,
  adminCreateSysUser as svcCreateSysUser,
  adminGrantRole as svcGrantRole,
  adminRemoveGroupMember as svcRemoveGroupMember,
  adminRevokeRole as svcRevokeRole,
  adminSetUserActive as svcSetUserActive,
  adminSetUserLocked as svcSetUserLocked,
  canOffline,
  createOwnSysUserProfile,
  fetchFullIdentity,
  getSupabaseSession,
  listSysUsers,
  onSupabaseAuthStateChange,
  signInWithUserName as supabaseSignIn,
  signOutEverywhere,
  signUpAuthAccount,
  sysUserDisplayName,
  toLegacyUser,
  type AclOperation,
  type AclResource,
  type EffectiveIdentity,
  type SysGroup,
  type SysRole,
} from './identity';
import { ensureIdentitySeed } from './identity/seed';

export type ActiveViewType =
  | { type: 'list'; table: string }
  | { type: 'form'; table: string; sys_id: string }
  | { type: 'catalog' }
  | { type: 'catalog_item'; itemId: string }
  | { type: 'script_background' }
  | { type: 'client_scripts' }
  | { type: 'business_rules' }
  | { type: 'flow_designer' }
  | { type: 'tables_dictionary' }
  | { type: 'update_sets' }
  | { type: 'user_administration' }
  | { type: 'practice_center' };

export interface HistoryItem {
  id: string;
  title: string;
  table?: string;
  view: ActiveViewType;
  timestamp: string;
}

export interface FavoriteItem {
  id: string;
  title: string;
  table?: string;
  view: ActiveViewType;
  icon?: string;
}

interface PlatformContextType {
  // Navigation & View
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  openRecord: (table: string, sys_id: string) => void;
  openList: (table: string) => void;

  // Users, Account Auth & Impersonation
  currentUser: User;
  actualUser: User;
  users: User[];
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (userName: string, password: string) => Promise<boolean>;
  register: (input: { user_name: string; name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  impersonateUser: (user: User) => void;
  endImpersonation: () => void;
  hasRole: (role: User['roles'][number]) => boolean;
  isAdmin: boolean;
  canAccess: (viewType: string, table?: string) => boolean;
  // ServiceNow-style identity (Supabase-backed when configured).
  identity: EffectiveIdentity | null;
  identitySource: 'supabase' | 'local';
  aclCan: (resource: AclResource, operation: AclOperation) => boolean;
  refreshIdentity: () => Promise<void>;
  adminCreateUser: (input: {
    user_name: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    department?: string;
    title?: string;
    roleNames?: string[];
    groupIds?: string[];
  }) => Promise<boolean>;
  adminSetUserActive: (userId: string, active: boolean) => Promise<boolean>;
  adminSetUserLocked: (userId: string, locked: boolean) => Promise<boolean>;
  adminGrantRole: (userId: string, roleId: string) => Promise<boolean>;
  adminRevokeRole: (userId: string, roleId: string) => Promise<boolean>;
  adminAddGroupMember: (groupId: string, userId: string) => Promise<boolean>;
  adminRemoveGroupMember: (groupId: string, userId: string) => Promise<boolean>;
  identityRoles: SysRole[];
  identityGroups: SysGroup[];

  // Environment Scope & Update Sets
  currentScope: string;
  setCurrentScope: (scope: string) => void;
  currentUpdateSet: UpdateSet;
  setCurrentUpdateSet: (us: UpdateSet) => void;
  updateSets: UpdateSet[];
  createUpdateSet: (name: string, app?: string) => UpdateSet;
  completeUpdateSet: (id: string) => void;

  // Favorites & History
  favorites: FavoriteItem[];
  toggleFavorite: (item: Omit<FavoriteItem, 'id'>) => void;
  isFavorite: (view: ActiveViewType) => boolean;
  history: HistoryItem[];
  addToHistory: (title: string, view: ActiveViewType, table?: string) => void;

  // Platform Data
  incidents: Incident[];
  problems: Problem[];
  changes: ChangeRequest[];
  groups: Group[];
  cis: ConfigurationItem[];
  catalogItems: CatalogItem[];
  serviceRequests: ServiceRequest[];
  knowledgeArticles: KnowledgeArticle[];
  tables: TableDefinition[];
  clientScripts: ClientScript[];
  businessRules: BusinessRule[];
  flows: FlowDefinition[];
  activityLogs: ActivityLog[];
  attachments: Attachment[];

  // CRUD & Business Logic
  saveIncident: (incident: Partial<Incident>) => Incident;
  deleteIncident: (sys_id: string) => void;
  deleteRecord: (table: string, sys_id: string) => void;
  saveProblem: (problem: Partial<Problem>) => Problem;
  saveChange: (change: Partial<ChangeRequest>) => ChangeRequest;
  saveCustomRecord: (table: string, record: any) => any;
  customRecords: Record<string, any[]>;
  createCustomTable: (table: TableDefinition) => void;
  saveClientScript: (script: ClientScript) => void;
  saveBusinessRule: (rule: BusinessRule) => void;
  saveFlow: (flow: FlowDefinition) => void;
  submitCatalogOrder: (itemId: string, variables: Record<string, any>) => ServiceRequest;
  addActivityLog: (log: Omit<ActivityLog, 'sys_id' | 'created_at'>) => void;
  addAttachment: (att: Omit<Attachment, 'sys_id' | 'created_at'>) => Attachment;

  // UI Settings
  theme: 'polaris-light' | 'polaris-dark' | 'high-contrast';
  setTheme: (theme: 'polaris-light' | 'polaris-dark' | 'high-contrast') => void;
  compactDensity: boolean;
  setCompactDensity: (compact: boolean) => void;
  listColumns: Record<string, string[]>;
  setListColumnsForTable: (table: string, columns: string[]) => void;

  // Helpers
  resetToDefaultData: () => void;
  setAllIncidents: (data: Incident[]) => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

function generateSysId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateRandomToken(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
}

const DEFAULT_IDENTITY_ROLES: SysRole[] = [
  { id: 'role_admin', name: 'admin', description: 'System administrator. Full platform access.', sys_created_on: '2026-09-01' },
  { id: 'role_security_admin', name: 'security_admin', description: 'Elevated security administrator.', sys_created_on: '2026-09-01' },
  { id: 'role_itil', name: 'itil', description: 'ITIL service desk agent.', sys_created_on: '2026-09-01' },
  { id: 'role_approver', name: 'approver', description: 'Can approve changes and requests.', sys_created_on: '2026-09-01' },
  { id: 'role_end_user', name: 'end_user', description: 'Self-service portal user.', sys_created_on: '2026-09-01' },
  { id: 'role_knowledge', name: 'knowledge', description: 'Can author and publish knowledge.', sys_created_on: '2026-09-01' },
];

const DEFAULT_IDENTITY_GROUPS: SysGroup[] = INITIAL_GROUPS.map((g) => ({
  id: g.sys_id,
  name: g.name,
  description: g.description,
  email: g.email || `${g.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}@service-now.simulator`,
  manager_id: g.manager_id || null,
  sys_created_on: '2026-09-01',
}));

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  // Current view state
  const [activeView, setActiveViewInternal] = useState<ActiveViewType>({
    type: 'list',
    table: 'incident',
  });

  // User & account auth state.
  // No default session: the login gate must authenticate first.
  // Supabase Auth is primary when configured; the local vault is the
  // offline fallback so the simulator works without a backend.
  const supabaseConfigured = Boolean(getSupabase());
  const [customUsers, setCustomUsers] = useState<User[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[] | null>(null);
  const users: User[] = directoryUsers ?? [...INITIAL_USERS, ...customUsers];
  const [actualUser, setActualUser] = useState<User>(INITIAL_USERS[0]); // System Administrator
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  // ServiceNow-style identity context (Supabase mode only).
  const [identity, setIdentity] = useState<EffectiveIdentity | null>(null);
  const [identityRoles, setIdentityRoles] = useState<SysRole[]>(DEFAULT_IDENTITY_ROLES);
  const [identityGroups, setIdentityGroups] = useState<SysGroup[]>(DEFAULT_IDENTITY_GROUPS);
  const identitySource: 'supabase' | 'local' = supabaseConfigured && identity ? 'supabase' : 'local';

  // Update Sets & Scope
  const [currentScope, setCurrentScope] = useState<string>('Global');
  const [updateSets, setUpdateSets] = useState<UpdateSet[]>(INITIAL_UPDATE_SETS);
  const [currentUpdateSet, setCurrentUpdateSet] = useState<UpdateSet>(INITIAL_UPDATE_SETS[0]);

  // Platform Data
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [problems, setProblems] = useState<Problem[]>(INITIAL_PROBLEMS);
  const [changes, setChanges] = useState<ChangeRequest[]>(INITIAL_CHANGES);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [cis, setCis] = useState<ConfigurationItem[]>(INITIAL_CIS);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(INITIAL_CATALOG_ITEMS);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(INITIAL_KNOWLEDGE);
  const [tables, setTables] = useState<TableDefinition[]>(INITIAL_TABLES);
  const [clientScripts, setClientScripts] = useState<ClientScript[]>(INITIAL_CLIENT_SCRIPTS);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>(INITIAL_BUSINESS_RULES);
  const [flows, setFlows] = useState<FlowDefinition[]>(INITIAL_FLOWS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [customRecords, setCustomRecords] = useState<Record<string, any[]>>({
    u_loaner_laptop: [
      {
        sys_id: 'loaner_1',
        u_asset_tag: 'AST-LNR-102',
        u_borrower: 'usr_abel',
        u_checkout_date: '2026-09-20 09:00:00',
        u_expected_return: '2026-09-28 17:00:00',
        u_status: 'checked_out',
      },
    ],
  });

  // UI preferences
  const [theme, setTheme] = useState<'polaris-light' | 'polaris-dark' | 'high-contrast'>('polaris-light');
  const [compactDensity, setCompactDensity] = useState<boolean>(false);
  const [listColumns, setListColumns] = useState<Record<string, string[]>>({
    incident: ['number', 'priority', 'state', 'short_description', 'caller_id', 'assigned_to', 'sys_updated_on'],
    problem: ['number', 'priority', 'state', 'short_description', 'assigned_to', 'root_cause'],
    change_request: ['number', 'type', 'state', 'priority', 'short_description', 'assigned_to', 'start_date'],
    sys_user: ['user_name', 'name', 'email', 'title', 'department'],
    cmdb_ci: ['name', 'class_name', 'asset_tag', 'status', 'ip_address'],
    sc_req_item: ['number', 'catalog_item_name', 'requested_for', 'stage', 'price', 'sys_created_on'],
    kb_knowledge: ['number', 'short_description', 'category', 'author', 'views', 'rating'],
  });

  // Favorites & History
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    { id: 'fav_1', title: 'Open Incidents', table: 'incident', view: { type: 'list', table: 'incident' } },
    { id: 'fav_2', title: 'Service Catalog', view: { type: 'catalog' } },
    { id: 'fav_3', title: 'Background Scripts', view: { type: 'script_background' } },
    { id: 'fav_4', title: 'Flow Designer', view: { type: 'flow_designer' } },
  ]);

  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'hist_init_1',
      title: 'INC0010001 - Outlook crashing',
      table: 'incident',
      view: { type: 'form', table: 'incident', sys_id: 'inc_1001' },
      timestamp: '5 mins ago',
    },
    {
      id: 'hist_init_2',
      title: 'Incidents List',
      table: 'incident',
      view: { type: 'list', table: 'incident' },
      timestamp: '15 mins ago',
    },
  ]);

  // Apply a resolved EffectiveIdentity to session state + directory.
  const applyIdentity = (
    resolved: EffectiveIdentity,
    roleById: Map<string, string>
  ) => {
    const legacy = toLegacyUser(resolved.sysUser, resolved.effectiveRoleNames);
    setIdentity(resolved);
    setActualUser(legacy);
    setCurrentUser(legacy);
    setIsAuthenticated(true);
    void roleById; // role map is consumed by aclCan via identity.acls
  };

  const loadDirectory = async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const res = await listSysUsers();
      if (res.ok) {
        // Directory roles per user would cost N queries; the list view only
        // needs names, so map with a lightweight default and let the admin
        // console load effective roles per selected user.
        setDirectoryUsers(res.data.map((u) => toLegacyUser(u, ['end_user'])));
      }
    } catch {
      // directory stays on local fallback
    }
  };

  const establishSupabaseSession = async (
    authUserId: string
  ): Promise<EffectiveIdentity | null> => {
    const res = await fetchFullIdentity(authUserId);
    if (!res.ok) {
      setAuthError(res.error);
      setIsAuthenticated(false);
      setIdentity(null);
      return null;
    }
    const roleById = new Map<string, string>();
    // Build role lookup from direct + group roles present in identity.
    for (const r of [...res.data.directRoles, ...res.data.groupRoles]) {
      roleById.set(r.id, r.name);
    }
    applyIdentity(res.data, roleById);
    void loadDirectory();
    // Best-effort seed when an admin signs in (RLS-gated, never fatal).
    if (
      res.data.effectiveRoleNames.includes('admin') ||
      res.data.effectiveRoleNames.includes('security_admin')
    ) {
      void ensureIdentitySeed().then((r) => {
        if (!r.seeded) console.warn('Identity seed skipped:', r.reason);
      });
    }
    return res.data;
  };

  // Restore session: Supabase Auth first, local vault fallback when offline.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    async function initAuth() {
      try {
        const sb = getSupabase();
        if (sb) {
          const existing = await getSupabaseSession();
          if (!cancelled && existing) {
            await establishSupabaseSession(existing.supabaseUser.id);
          }
          if (!cancelled) {
            onSupabaseAuthStateChange((sess) => {
              if (cancelled) return;
              if (sess) {
                void establishSupabaseSession(sess.supabaseUser.id);
              } else {
                setIsAuthenticated(false);
                setIdentity(null);
              }
            });
          }
        } else {
          // Offline fallback: local vault + localStorage session.
          const storedCustom = loadCustomUsers();
          if (!cancelled && storedCustom.length > 0) {
            setCustomUsers(storedCustom);
          }
          const allUsers = [...INITIAL_USERS, ...storedCustom];
          await seedDefaultCredentials(allUsers);
          const sessionName = loadSessionUserName();
          if (!cancelled && sessionName) {
            const match = allUsers.find(
              (u) => u.user_name.toLowerCase() === sessionName.toLowerCase()
            );
            if (match) {
              setActualUser(match);
              setCurrentUser(match);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    }
    initAuth();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from LocalStorage on mount (scheduled asynchronously to avoid cascading renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        const savedIncidents = localStorage.getItem('sn_data_incidents');
        if (savedIncidents) setIncidents(JSON.parse(savedIncidents));

        const savedTheme = localStorage.getItem('sn_ui_theme');
        if (savedTheme) setTheme(savedTheme as any);

        const savedDensity = localStorage.getItem('sn_ui_compact');
        if (savedDensity) setCompactDensity(JSON.parse(savedDensity));

        const savedCols = localStorage.getItem('sn_list_columns');
        if (savedCols) setListColumns(JSON.parse(savedCols));

        const savedTables = localStorage.getItem('sn_data_tables');
        if (savedTables) setTables(JSON.parse(savedTables));

        const savedScripts = localStorage.getItem('sn_data_client_scripts');
        if (savedScripts) setClientScripts(JSON.parse(savedScripts));

        const savedRules = localStorage.getItem('sn_data_business_rules');
        if (savedRules) setBusinessRules(JSON.parse(savedRules));

        const savedFlows = localStorage.getItem('sn_data_flows');
        if (savedFlows) setFlows(JSON.parse(savedFlows));

        const savedRequests = localStorage.getItem('sn_data_requests');
        if (savedRequests) setServiceRequests(JSON.parse(savedRequests));

        const savedLogs = localStorage.getItem('sn_data_activity');
        if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to load cached ServiceNow data:', e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_ui_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_ui_compact', JSON.stringify(compactDensity));
  }, [compactDensity]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_list_columns', JSON.stringify(listColumns));
  }, [listColumns]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_client_scripts', JSON.stringify(clientScripts));
  }, [clientScripts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_business_rules', JSON.stringify(businessRules));
  }, [businessRules]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_flows', JSON.stringify(flows));
  }, [flows]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_requests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sn_data_activity', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Sync with Supabase in background if configured
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Load initial data from Supabase if available
    async function loadFromSupabase() {
      try {
        const { data: supaIncidents } = await supabase!.from('sn_incidents').select('*');
        if (supaIncidents && supaIncidents.length > 0) {
          setIncidents(supaIncidents);
        }
      } catch (err) {
        console.warn('Supabase sync skipped (schema not initialized):', err);
      }
    }
    loadFromSupabase();
  }, []);

  const setActiveView = (view: ActiveViewType) => {
    setActiveViewInternal(view);
  };

  const openRecord = (table: string, sys_id: string) => {
    setActiveViewInternal({ type: 'form', table, sys_id });
    const title = sys_id === 'new' ? `New ${table}` : `${table.toUpperCase()} - ${sys_id}`;
    addToHistory(title, { type: 'form', table, sys_id }, table);
  };

  const openList = (table: string) => {
    setActiveViewInternal({ type: 'list', table });
    addToHistory(`${table.toUpperCase()} List`, { type: 'list', table }, table);
  };

  const addToHistory = (title: string, view: ActiveViewType, table?: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => JSON.stringify(h.view) !== JSON.stringify(view)
      );
      return [
        {
          id: 'hist_' + Date.now(),
          title,
          table,
          view,
          timestamp: 'Just now',
        },
        ...filtered.slice(0, 19),
      ];
    });
  };

  const isFavorite = (view: ActiveViewType) => {
    return favorites.some((f) => JSON.stringify(f.view) === JSON.stringify(view));
  };

  const toggleFavorite = (item: Omit<FavoriteItem, 'id'>) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => JSON.stringify(f.view) === JSON.stringify(item.view));
      if (exists) {
        return prev.filter((f) => f.id !== exists.id);
      } else {
        return [{ id: 'fav_' + Date.now(), ...item }, ...prev];
      }
    });
  };

  const clearAuthError = () => setAuthError(null);

  const findUserByName = (userName: string, list: User[] = users) =>
    list.find((u) => u.user_name.toLowerCase() === userName.trim().toLowerCase());

  // -- Offline (local vault) login/register ---------------------------------
  const loginLocal = async (userName: string, password: string): Promise<boolean> => {
    const key = userName.trim().toLowerCase();
    const target = findUserByName(userName);
    if (!target) {
      setAuthError('Invalid User ID or password.');
      return false;
    }
    const vault = await seedDefaultCredentials(users);
    const cred = vault[key];
    if (!cred) {
      setAuthError('No password is set for this account. Ask an administrator to reset it.');
      return false;
    }
    const attempt = await hashPassword(password, cred.salt);
    if (attempt !== cred.passwordHash) {
      setAuthError('Invalid User ID or password.');
      return false;
    }
    setActualUser(target);
    setCurrentUser(target);
    setIsAuthenticated(true);
    saveSession(target.user_name);
    addActivityLog({
      table_name: 'sys_user',
      record_id: target.sys_id,
      user_name: target.name,
      user_id: target.sys_id,
      type: 'field_change',
      field_name: 'Session',
      new_value: `Login successful for ${target.user_name} (local session)`,
    });
    return true;
  };

  const registerLocal = async (input: {
    user_name: string;
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    if (findUserByName(input.user_name)) {
      setAuthError('That User ID is already taken. Try signing in instead.');
      return false;
    }
    const { splitName } = await import('./identity/types');
    const { first_name, last_name } = splitName(input.name);
    void first_name;
    void last_name;
    const newUser: User = {
      sys_id: generateSysId('usr'),
      user_name: input.user_name.trim(),
      name: input.name.trim(),
      email: input.email.trim(),
      roles: ['end_user'],
      title: 'Self-registered User',
      department: 'Self Service',
    };
    const salt = generateRandomToken();
    const passwordHash = await hashPassword(input.password, salt);
    const vault = loadCredentials();
    vault[newUser.user_name.toLowerCase()] = {
      userName: newUser.user_name.toLowerCase(),
      sysId: newUser.sys_id,
      salt,
      passwordHash,
    };
    saveCredentials(vault);
    const nextCustom = [...customUsers, newUser];
    setCustomUsers(nextCustom);
    saveCustomUsers(nextCustom);
    setActualUser(newUser);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    saveSession(newUser.user_name);
    return true;
  };

  // -- Primary login: Supabase Auth + sys_user identity ----------------------
  const login = async (userName: string, password: string): Promise<boolean> => {
    setAuthError(null);
    const key = userName.trim().toLowerCase();
    if (!key || !password) {
      setAuthError('Enter your User ID and password.');
      return false;
    }
    if (!getSupabase()) return loginLocal(userName, password);

    const result = await supabaseSignIn(userName, password);
    if (!result.ok) {
      setAuthError(result.error);
      return false;
    }
    const established = await establishSupabaseSession(result.session.supabaseUser.id);
    if (!established) {
      // Identity problem (no profile / inactive / locked): end Auth session.
      await signOutEverywhere();
      return false;
    }
    addActivityLog({
      table_name: 'sys_user',
      record_id: established.sysUser.id,
      user_name: sysUserDisplayName(established.sysUser),
      user_id: established.sysUser.id,
      type: 'field_change',
      field_name: 'Session',
      new_value: `Login successful for ${established.sysUser.user_name} (Supabase session)`,
    });
    return true;
  };

  const register = async (input: {
    user_name: string;
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    setAuthError(null);
    const nameErr = validateUserName(input.user_name);
    if (nameErr) {
      setAuthError(nameErr);
      return false;
    }
    if (!input.name.trim()) {
      setAuthError('Enter your full name.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) {
      setAuthError('Enter a valid email address.');
      return false;
    }
    const pwErr = validatePasswordStrength(input.password);
    if (pwErr) {
      setAuthError(pwErr);
      return false;
    }
    if (!getSupabase()) return registerLocal(input);

    const { splitName } = await import('./identity/types');
    const { first_name, last_name } = splitName(input.name);
    const signUp = await signUpAuthAccount({
      user_name: input.user_name.trim(),
      email: input.email.trim(),
      password: input.password,
      first_name,
      last_name,
    });
    if (!signUp.ok) {
      setAuthError(signUp.error);
      return false;
    }
    if (signUp.needsEmailConfirmation || !signUp.authUserId) {
      setAuthError(
        'Account created. Confirm your email, then sign in. (Disable email confirmation in Supabase Auth for instant practice logins.)'
      );
      return false;
    }
    const profile = await createOwnSysUserProfile({
      auth_user_id: signUp.authUserId,
      user_name: input.user_name.trim(),
      email: input.email.trim(),
      first_name,
      last_name,
    });
    if (!profile.ok) {
      setAuthError(profile.error);
      return false;
    }
    const established = await establishSupabaseSession(signUp.authUserId);
    return established !== null;
  };

  const logout = () => {
    const departing = actualUser;
    void signOutEverywhere();
    saveSession(null);
    // Clear any impersonation and return to the login gate.
    setCurrentUser(departing);
    setActualUser(departing);
    setIdentity(null);
    setIsAuthenticated(false);
    setActiveViewInternal({ type: 'catalog' });
  };

  const refreshIdentity = async () => {
    const sess = await getSupabaseSession();
    if (!sess) return;
    await establishSupabaseSession(sess.supabaseUser.id);
    await loadDirectory();
  };

  const impersonateUser = (user: User) => {
    // ServiceNow behavior: only admins/security_admins may impersonate.
    if (!userIsAdmin(actualUser)) {
      setAuthError('Only administrators can impersonate other users.');
      return;
    }
    setCurrentUser(user);
    addActivityLog({
      table_name: 'sys_user',
      record_id: user.sys_id,
      user_name: actualUser.name,
      user_id: actualUser.sys_id,
      type: 'field_change',
      field_name: 'Session',
      old_value: actualUser.user_name,
      new_value: `Impersonated by ${actualUser.name}`,
    });
  };

  const endImpersonation = () => {
    setCurrentUser(actualUser);
  };

  const effectiveRoleNames = identity
    ? identity.effectiveRoleNames
    : currentUser.roles.map((r) => r.toLowerCase());
  const hasRole = (role: User['roles'][number]) =>
    effectiveRoleNames.includes(role.toLowerCase());
  const isAdmin =
    effectiveRoleNames.includes('admin') || effectiveRoleNames.includes('security_admin');

  /**
   * ACL-style check for any ITSM resource/operation.
   * Supabase mode evaluates the sys_acl rows through roles/groups;
   * offline mode uses the mirrored fallback policy. Future modules
   * (Incident/Problem/Change/Request/Knowledge) call this directly.
   */
  const aclCan = (resource: AclResource, operation: AclOperation): boolean => {
    if (identity) {
      const roleById = new Map<string, string>();
      for (const r of [...identity.directRoles, ...identity.groupRoles]) {
        roleById.set(r.id, r.name);
      }
      const ctx = {
        effectiveRoleNames: identity.effectiveRoleNames,
        groupIds: identity.groups.map((g) => g.id),
        isAdmin:
          identity.effectiveRoleNames.includes('admin') ||
          identity.effectiveRoleNames.includes('security_admin'),
      };
      const rows = identity.acls.filter(
        (a) => a.active && a.resource === resource && a.operation === operation
      );
      if (ctx.isAdmin) return true;
      if (rows.length === 0) return false;
      return rows.some((row) => {
        if (!row.required_role_id && !row.required_group_id) return true;
        if (row.required_role_id) {
          const name = roleById.get(row.required_role_id);
          if (name && ctx.effectiveRoleNames.includes(name.toLowerCase())) return true;
        }
        if (row.required_group_id && ctx.groupIds.includes(row.required_group_id)) return true;
        return false;
      });
    }
    return canOffline(
      currentUser.roles.map((r) => r.toLowerCase()),
      resource,
      operation
    );
  };

  // View gate maps legacy views onto (resource, read) ACL checks.
  const canAccess = (viewType: string, table?: string): boolean => {
    if (identity) {
      const adminViews = new Set([
        'script_background',
        'client_scripts',
        'business_rules',
        'flow_designer',
        'tables_dictionary',
        'update_sets',
        'user_administration',
      ]);
      if (adminViews.has(viewType)) return isAdmin;
      if (viewType === 'catalog' || viewType === 'catalog_item') {
        return aclCan('catalog', 'read');
      }
      if (viewType === 'list' || viewType === 'form') {
        const tableToResource: Record<string, AclResource> = {
          incident: 'incident',
          problem: 'problem',
          change_request: 'change_request',
          sc_req_item: 'sc_req_item',
          kb_knowledge: 'kb_knowledge',
          sys_user: 'sys_user',
        };
        const resource = table ? tableToResource[table] : undefined;
        if (resource) return aclCan(resource, 'read');
        // Tables without an ACL resource yet (cmdb_ci, custom): staff only.
        if (table === 'cmdb_ci' || (table && table.startsWith('u_'))) {
          return (
            isAdmin ||
            effectiveRoleNames.includes('itil')
          );
        }
        return true;
      }
      return true;
    }
    return userCanAccessView(currentUser, viewType, table);
  };

  // -- Admin: user/role/group management (Supabase-backed + local fallback) ---
  const requireAdmin = (): boolean => {
    if (!isAdmin) {
      setAuthError('Only administrators can manage users, roles and groups.');
      return false;
    }
    return true;
  };

  const adminCreateUser: PlatformContextType['adminCreateUser'] = async (input) => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    const nameErr = validateUserName(input.user_name);
    if (nameErr) {
      setAuthError(nameErr);
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) {
      setAuthError('Enter a valid email address.');
      return false;
    }
    const pwErr = validatePasswordStrength(input.password);
    if (pwErr) {
      setAuthError(pwErr);
      return false;
    }

    if (identitySource !== 'supabase') {
      if (findUserByName(input.user_name)) {
        setAuthError('That User ID is already taken.');
        return false;
      }
      const fullName = `${input.first_name.trim()} ${input.last_name.trim()}`.trim() || input.user_name.trim();
      const userRoles: Role[] = (input.roleNames && input.roleNames.length > 0)
        ? (input.roleNames.map((r) => r.toLowerCase() as Role))
        : ['end_user'];
      const newUser: User = {
        sys_id: generateSysId('usr'),
        user_name: input.user_name.trim(),
        name: fullName,
        email: input.email.trim(),
        roles: userRoles,
        title: input.title || 'User',
        department: input.department || 'Enterprise Support',
      };
      const salt = generateRandomToken();
      const passwordHash = await hashPassword(input.password, salt);
      const vault = loadCredentials();
      vault[newUser.user_name.toLowerCase()] = {
        userName: newUser.user_name.toLowerCase(),
        sysId: newUser.sys_id,
        salt,
        passwordHash,
      };
      saveCredentials(vault);
      const nextCustom = [...customUsers, newUser];
      setCustomUsers(nextCustom);
      saveCustomUsers(nextCustom);
      return true;
    }

    try {
      // 1. Create the Auth account (credentials holder).
      const { signUpAuthAccount: signUp } = await import('./identity/authentication');
      const signUpRes = await signUp({
        user_name: input.user_name.trim(),
        email: input.email.trim(),
        password: input.password,
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
      });
      if (!signUpRes.ok) {
        setAuthError(signUpRes.error);
        return false;
      }
      // 2. Create the sys_user profile (+ roles/groups).
      const created = await svcCreateSysUser({
        user_name: input.user_name.trim(),
        email: input.email.trim(),
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        department: input.department,
        title: input.title,
        auth_user_id: signUpRes.authUserId,
        roleNames: input.roleNames,
        groupIds: input.groupIds,
      });
      if (!created.ok) {
        setAuthError(created.error);
        return false;
      }
      await loadDirectory();
      return true;
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create user in Supabase directory.');
      return false;
    }
  };

  const adminSetUserActive = async (userId: string, active: boolean): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    if (identitySource === 'supabase') {
      const res = await svcSetUserActive(userId, active);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await loadDirectory();
      await refreshIdentity();
    }
    return true;
  };

  const adminSetUserLocked = async (userId: string, locked: boolean): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    if (identitySource === 'supabase') {
      const res = await svcSetUserLocked(userId, locked);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await loadDirectory();
    }
    return true;
  };

  const adminGrantRole = async (userId: string, roleId: string): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    const roleObj = identityRoles.find((r) => r.id === roleId);
    const roleName = (roleObj?.name || roleId).toLowerCase() as Role;
    setCustomUsers((prev) =>
      prev.map((u) => {
        if (u.sys_id === userId) {
          const roles = u.roles.includes(roleName) ? u.roles : [...u.roles, roleName];
          return { ...u, roles };
        }
        return u;
      })
    );
    if (identitySource === 'supabase') {
      const res = await svcGrantRole(userId, roleId);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await refreshIdentity();
    }
    return true;
  };

  const adminRevokeRole = async (userId: string, roleId: string): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    const roleObj = identityRoles.find((r) => r.id === roleId);
    const roleName = (roleObj?.name || roleId).toLowerCase() as Role;
    setCustomUsers((prev) =>
      prev.map((u) => {
        if (u.sys_id === userId) {
          return { ...u, roles: u.roles.filter((r) => r !== roleName) };
        }
        return u;
      })
    );
    if (identitySource === 'supabase') {
      const res = await svcRevokeRole(userId, roleId);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await refreshIdentity();
    }
    return true;
  };

  const adminAddGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    if (identitySource === 'supabase') {
      const res = await svcAddGroupMember(groupId, userId);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await refreshIdentity();
    }
    return true;
  };

  const adminRemoveGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
    setAuthError(null);
    if (!requireAdmin()) return false;
    if (identitySource === 'supabase') {
      const res = await svcRemoveGroupMember(groupId, userId);
      if (!res.ok) {
        setAuthError(res.error);
        return false;
      }
      await refreshIdentity();
    }
    return true;
  };

  // Load identity directories (roles/groups) once authenticated via Supabase.
  useEffect(() => {
    if (!getSupabase() || !isAuthenticated || !identity) return;
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const [rolesRes, groupsRes] = await Promise.all([
        sb.from('sys_role').select('*').order('name'),
        sb.from('sys_group').select('*').order('name'),
      ]);
      if (rolesRes.data) setIdentityRoles(rolesRes.data as SysRole[]);
      if (groupsRes.data) setIdentityGroups(groupsRes.data as SysGroup[]);
    })();
  }, [isAuthenticated, identity]);

  // Record an action in the active Update Set
  const recordUpdateSetChange = (
    type: 'Table' | 'Field' | 'Client Script' | 'Business Rule' | 'Catalog Item' | 'Flow',
    targetName: string,
    action: 'Insert' | 'Update' | 'Delete'
  ) => {
    if (!currentUpdateSet) return;
    const newChange = {
      sys_id: generateSysId('chg'),
      type,
      target_name: targetName,
      action,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setUpdateSets((prev) =>
      prev.map((us) =>
        us.sys_id === currentUpdateSet.sys_id
          ? {
              ...us,
              changes_count: us.changes_count + 1,
              changes: [newChange, ...us.changes],
            }
          : us
      )
    );
  };

  const createUpdateSet = (name: string, app: string = 'Global'): UpdateSet => {
    const newUS: UpdateSet = {
      sys_id: generateSysId('us'),
      name,
      state: 'in_progress',
      application: app,
      created_by: currentUser.user_name,
      sys_created_on: new Date().toISOString().replace('T', ' ').substring(0, 19),
      changes_count: 0,
      changes: [],
    };
    setUpdateSets((prev) => [newUS, ...prev]);
    setCurrentUpdateSet(newUS);
    return newUS;
  };

  const completeUpdateSet = (id: string) => {
    setUpdateSets((prev) =>
      prev.map((us) => (us.sys_id === id ? { ...us, state: 'complete' } : us))
    );
  };

  // Calculate priority based on Impact & Urgency matrix
  const calculatePriority = (impact: string, urgency: string): '1' | '2' | '3' | '4' | '5' => {
    const imp = parseInt(impact) || 3;
    const urg = parseInt(urgency) || 3;
    if (imp === 1 && urg === 1) return '1';
    const sum = imp + urg;
    if (sum === 3) return '2';
    if (sum === 4) return '3';
    if (sum === 5) return '4';
    return '5';
  };

  // Execute Business Rules for Incident
  const runIncidentBusinessRules = (inc: Incident, prev?: Incident): Incident => {
    const modified = { ...inc };

    // Auto calculate priority
    modified.priority = calculatePriority(modified.impact, modified.urgency);

    // If state changed to 6 (Resolved), stamp resolved_at & resolved_by
    if (modified.state === '6' && (!prev || prev.state !== '6')) {
      if (!modified.resolved_at) {
        modified.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
      if (!modified.resolved_by) {
        modified.resolved_by = currentUser.sys_id;
      }
    }

    // If state changed to 7 (Closed), stamp closed_at
    if (modified.state === '7' && (!prev || prev.state !== '7')) {
      if (!modified.closed_at) {
        modified.closed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    return modified;
  };

  const saveIncident = (incidentData: Partial<Incident>): Incident => {
    const isNew = !incidentData.sys_id || incidentData.sys_id === 'new';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let saved: Incident;

    if (isNew) {
      const nextNum = 10000 + incidents.length + 1;
      const newInc: Incident = {
        sys_id: generateSysId('inc'),
        number: `INC00${nextNum}`,
        short_description: incidentData.short_description || 'New Incident',
        description: incidentData.description || '',
        state: incidentData.state || '1',
        caller_id: incidentData.caller_id || currentUser.sys_id,
        category: incidentData.category || 'Software',
        subcategory: incidentData.subcategory || '',
        impact: incidentData.impact || '3',
        urgency: incidentData.urgency || '3',
        priority: '4',
        assignment_group: incidentData.assignment_group || 'grp_servicedesk',
        assigned_to: incidentData.assigned_to,
        cmdb_ci: incidentData.cmdb_ci,
        work_notes: incidentData.work_notes,
        comments: incidentData.comments,
        sys_created_on: now,
        sys_updated_on: now,
        sys_created_by: currentUser.user_name,
        ...incidentData,
      };

      saved = runIncidentBusinessRules(newInc);
      setIncidents((prev) => [saved, ...prev]);

      addActivityLog({
        table_name: 'incident',
        record_id: saved.sys_id,
        user_name: currentUser.name,
        user_id: currentUser.sys_id,
        type: 'field_change',
        field_name: 'Created',
        new_value: `Incident ${saved.number} created`,
      });

      // Also sync to Supabase if connected
      const supabase = getSupabase();
      if (supabase) {
        supabase.from('sn_incidents').insert(saved).then();
      }
    } else {
      const existing = incidents.find((i) => i.sys_id === incidentData.sys_id);
      const updated = {
        ...existing,
        ...incidentData,
        sys_updated_on: now,
      } as Incident;

      saved = runIncidentBusinessRules(updated, existing);
      setIncidents((prev) => prev.map((i) => (i.sys_id === saved.sys_id ? saved : i)));

      // Record activity if work notes or comments added
      if (incidentData.work_notes && incidentData.work_notes.trim()) {
        addActivityLog({
          table_name: 'incident',
          record_id: saved.sys_id,
          user_name: currentUser.name,
          user_id: currentUser.sys_id,
          type: 'work_notes',
          text: incidentData.work_notes,
        });
      }
      if (incidentData.comments && incidentData.comments.trim()) {
        addActivityLog({
          table_name: 'incident',
          record_id: saved.sys_id,
          user_name: currentUser.name,
          user_id: currentUser.sys_id,
          type: 'comments',
          text: incidentData.comments,
        });
      }

      const supabase = getSupabase();
      if (supabase) {
        supabase.from('sn_incidents').update(saved).eq('sys_id', saved.sys_id).then();
      }
    }

    return saved;
  };

  const deleteRecord = (table: string, sys_id: string) => {
    switch (table) {
      case 'incident':
        setIncidents((prev) => prev.filter((i) => i.sys_id !== sys_id));
        break;
      case 'problem':
        setProblems((prev) => prev.filter((p) => p.sys_id !== sys_id));
        break;
      case 'change_request':
        setChanges((prev) => prev.filter((c) => c.sys_id !== sys_id));
        break;
      case 'sc_req_item':
        setServiceRequests((prev) => prev.filter((r) => r.sys_id !== sys_id));
        break;
      case 'kb_knowledge':
        setKnowledgeArticles((prev) => prev.filter((k) => k.sys_id !== sys_id));
        break;
      default:
        setCustomRecords((prev) => ({
          ...prev,
          [table]: (prev[table] || []).filter((r: any) => r.sys_id !== sys_id),
        }));
        break;
    }

    const supabase = getSupabase();
    if (supabase) {
      const dbTable = table === 'incident' ? 'sn_incidents' : table;
      supabase.from(dbTable).delete().eq('sys_id', sys_id).then();
    }
  };

  const deleteIncident = (sys_id: string) => {
    deleteRecord('incident', sys_id);
  };

  const saveProblem = (probData: Partial<Problem>): Problem => {
    const isNew = !probData.sys_id || probData.sys_id === 'new';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let saved: Problem;
    if (isNew) {
      const nextNum = 100 + problems.length + 1;
      saved = {
        sys_id: generateSysId('prb'),
        number: `PRB000${nextNum}`,
        short_description: probData.short_description || 'New Problem',
        description: probData.description || '',
        state: probData.state || '1',
        priority: probData.priority || '3',
        impact: probData.impact || '3',
        urgency: probData.urgency || '3',
        assigned_to: probData.assigned_to,
        assignment_group: probData.assignment_group,
        root_cause: probData.root_cause,
        workaround: probData.workaround,
        sys_created_on: now,
        sys_updated_on: now,
        ...probData,
      };
      setProblems((prev) => [saved, ...prev]);
    } else {
      const existing = problems.find((p) => p.sys_id === probData.sys_id);
      saved = { ...existing, ...probData, sys_updated_on: now } as Problem;
      setProblems((prev) => prev.map((p) => (p.sys_id === saved.sys_id ? saved : p)));
    }
    return saved;
  };

  const saveChange = (chgData: Partial<ChangeRequest>): ChangeRequest => {
    const isNew = !chgData.sys_id || chgData.sys_id === 'new';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let saved: ChangeRequest;
    if (isNew) {
      const nextNum = 30000 + changes.length + 1;
      saved = {
        sys_id: generateSysId('chg'),
        number: `CHG00${nextNum}`,
        short_description: chgData.short_description || 'New Change Request',
        description: chgData.description || '',
        type: chgData.type || 'Normal',
        state: chgData.state || 'Draft',
        risk: chgData.risk || 'Moderate',
        priority: chgData.priority || '3',
        impact: chgData.impact || '3',
        urgency: chgData.urgency || '3',
        assigned_to: chgData.assigned_to,
        assignment_group: chgData.assignment_group,
        justification: chgData.justification,
        implementation_plan: chgData.implementation_plan,
        rollback_plan: chgData.rollback_plan,
        sys_created_on: now,
        sys_updated_on: now,
        ...chgData,
      };
      setChanges((prev) => [saved, ...prev]);
    } else {
      const existing = changes.find((c) => c.sys_id === chgData.sys_id);
      saved = { ...existing, ...chgData, sys_updated_on: now } as ChangeRequest;
      setChanges((prev) => prev.map((c) => (c.sys_id === saved.sys_id ? saved : c)));
    }
    return saved;
  };

  const saveCustomRecord = (table: string, record: any) => {
    const isNew = !record.sys_id || record.sys_id === 'new';
    const sys_id = isNew ? generateSysId('rec') : record.sys_id;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = { ...record, sys_id, sys_updated_on: now, sys_created_on: record.sys_created_on || now };

    setCustomRecords((prev) => {
      const tableList = prev[table] || [];
      if (isNew) {
        return { ...prev, [table]: [updated, ...tableList] };
      } else {
        return {
          ...prev,
          [table]: tableList.map((r) => (r.sys_id === sys_id ? updated : r)),
        };
      }
    });

    return updated;
  };

  const createCustomTable = (table: TableDefinition) => {
    setTables((prev) => [...prev, table]);
    recordUpdateSetChange('Table', table.name, 'Insert');
    setCustomRecords((prev) => ({ ...prev, [table.name]: [] }));
  };

  const saveClientScript = (script: ClientScript) => {
    const isNew = !script.sys_id || script.sys_id === 'new';
    const targetScript = {
      ...script,
      sys_id: isNew ? generateSysId('cs') : script.sys_id,
    };
    setClientScripts((prev) =>
      isNew ? [targetScript, ...prev] : prev.map((s) => (s.sys_id === targetScript.sys_id ? targetScript : s))
    );
    recordUpdateSetChange('Client Script', targetScript.name, isNew ? 'Insert' : 'Update');
  };

  const saveBusinessRule = (rule: BusinessRule) => {
    const isNew = !rule.sys_id || rule.sys_id === 'new';
    const targetRule = {
      ...rule,
      sys_id: isNew ? generateSysId('br') : rule.sys_id,
    };
    setBusinessRules((prev) =>
      isNew ? [targetRule, ...prev] : prev.map((r) => (r.sys_id === targetRule.sys_id ? targetRule : r))
    );
    recordUpdateSetChange('Business Rule', targetRule.name, isNew ? 'Insert' : 'Update');
  };

  const saveFlow = (flow: FlowDefinition) => {
    const isNew = !flow.sys_id || flow.sys_id === 'new';
    const targetFlow = {
      ...flow,
      sys_id: isNew ? generateSysId('flow') : flow.sys_id,
    };
    setFlows((prev) =>
      isNew ? [targetFlow, ...prev] : prev.map((f) => (f.sys_id === targetFlow.sys_id ? targetFlow : f))
    );
    recordUpdateSetChange('Flow', targetFlow.name, isNew ? 'Insert' : 'Update');
  };

  const submitCatalogOrder = (itemId: string, variables: Record<string, any>): ServiceRequest => {
    const item = catalogItems.find((i) => i.sys_id === itemId);
    const count = serviceRequests.length + 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newReq: ServiceRequest = {
      sys_id: generateSysId('req'),
      number: `REQ00${10000 + count}`,
      ritm_number: `RITM00${10000 + count}`,
      sctask_number: `SCTASK00${10000 + count}`,
      catalog_item_id: itemId,
      catalog_item_name: item?.name || 'Catalog Item',
      requested_for: currentUser.sys_id,
      requested_by: currentUser.sys_id,
      stage: 'Fulfillment',
      state: '2',
      price: item?.price || 0,
      variable_responses: variables,
      sys_created_on: now,
      sys_updated_on: now,
    };

    setServiceRequests((prev) => [newReq, ...prev]);

    // Add activity log
    addActivityLog({
      table_name: 'sc_req_item',
      record_id: newReq.sys_id,
      user_name: currentUser.name,
      user_id: currentUser.sys_id,
      type: 'field_change',
      field_name: 'Ordered',
      new_value: `Catalog order submitted: ${newReq.ritm_number}`,
    });

    return newReq;
  };

  const addActivityLog = (log: Omit<ActivityLog, 'sys_id' | 'created_at'>) => {
    const newLog: ActivityLog = {
      ...log,
      sys_id: generateSysId('act'),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const addAttachment = (att: Omit<Attachment, 'sys_id' | 'created_at'>): Attachment => {
    const newAtt: Attachment = {
      ...att,
      sys_id: generateSysId('att'),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAttachments((prev) => [newAtt, ...prev]);

    addActivityLog({
      table_name: att.table_name,
      record_id: att.table_sys_id,
      user_name: currentUser.name,
      user_id: currentUser.sys_id,
      type: 'field_change',
      field_name: 'Attachment',
      new_value: `Attached file: ${att.file_name} (${Math.round(att.file_size / 1024)} KB)`,
    });

    return newAtt;
  };

  const setListColumnsForTable = (table: string, columns: string[]) => {
    setListColumns((prev) => ({
      ...prev,
      [table]: columns,
    }));
  };

  const resetToDefaultData = () => {
    setIncidents(INITIAL_INCIDENTS);
    setProblems(INITIAL_PROBLEMS);
    setChanges(INITIAL_CHANGES);
    // Preserve accounts + session: only clear platform demo data keys.
    setGroups(INITIAL_GROUPS);
    setCis(INITIAL_CIS);
    setTables(INITIAL_TABLES);
    setClientScripts(INITIAL_CLIENT_SCRIPTS);
    setBusinessRules(INITIAL_BUSINESS_RULES);
    setFlows(INITIAL_FLOWS);
    setServiceRequests(INITIAL_REQUESTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    if (typeof window !== 'undefined') {
      [
        'sn_data_incidents',
        'sn_data_tables',
        'sn_data_client_scripts',
        'sn_data_business_rules',
        'sn_data_flows',
        'sn_data_requests',
        'sn_data_activity',
        'sn_list_columns',
      ].forEach((k) => localStorage.removeItem(k));
    }
  };

  return (
    <PlatformContext.Provider
      value={{
        activeView,
        setActiveView,
        openRecord,
        openList,
        currentUser,
        actualUser,
        users,
        isAuthenticated,
        isAuthLoading,
        authError,
        clearAuthError,
        login,
        register,
        logout,
        impersonateUser,
        endImpersonation,
        hasRole,
        isAdmin,
        canAccess,
        identity,
        identitySource,
        aclCan,
        refreshIdentity,
        adminCreateUser,
        adminSetUserActive,
        adminSetUserLocked,
        adminGrantRole,
        adminRevokeRole,
        adminAddGroupMember,
        adminRemoveGroupMember,
        identityRoles,
        identityGroups,
        currentScope,
        setCurrentScope,
        currentUpdateSet,
        setCurrentUpdateSet,
        updateSets,
        createUpdateSet,
        completeUpdateSet,
        favorites,
        toggleFavorite,
        isFavorite,
        history,
        addToHistory,
        incidents,
        problems,
        changes,
        groups,
        cis,
        catalogItems,
        serviceRequests,
        knowledgeArticles,
        tables,
        clientScripts,
        businessRules,
        flows,
        activityLogs,
        attachments,
        saveIncident,
        deleteIncident,
        deleteRecord,
        saveProblem,
        saveChange,
        saveCustomRecord,
        customRecords,
        createCustomTable,
        saveClientScript,
        saveBusinessRule,
        saveFlow,
        submitCatalogOrder,
        addActivityLog,
        addAttachment,
        theme,
        setTheme,
        compactDensity,
        setCompactDensity,
        listColumns,
        setListColumnsForTable,
        resetToDefaultData,
        setAllIncidents: setIncidents,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
