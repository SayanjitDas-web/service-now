'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
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

  // Users & Impersonation
  currentUser: User;
  actualUser: User;
  users: User[];
  impersonateUser: (user: User) => void;
  endImpersonation: () => void;

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

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  // Current view state
  const [activeView, setActiveViewInternal] = useState<ActiveViewType>({
    type: 'list',
    table: 'incident',
  });

  // User state
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [actualUser, setActualUser] = useState<User>(INITIAL_USERS[0]); // System Administrator
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

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

  // Load from LocalStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  const impersonateUser = (user: User) => {
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

  // Record an action in the active Update Set
  const recordUpdateSetChange = (
    type: 'Table' | 'Field' | 'Client Script' | 'Business Rule' | 'Catalog Item' | 'Flow',
    targetName: string,
    action: 'Insert' | 'Update' | 'Delete'
  ) => {
    if (!currentUpdateSet) return;
    const newChange = {
      sys_id: 'chg_' + Math.random().toString(36).substring(2, 9),
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
      sys_id: 'us_' + Math.random().toString(36).substring(2, 9),
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
        sys_id: 'inc_' + Math.random().toString(36).substring(2, 9),
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

  const deleteIncident = (sys_id: string) => {
    setIncidents((prev) => prev.filter((i) => i.sys_id !== sys_id));
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('sn_incidents').delete().eq('sys_id', sys_id).then();
    }
  };

  const saveProblem = (probData: Partial<Problem>): Problem => {
    const isNew = !probData.sys_id || probData.sys_id === 'new';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let saved: Problem;
    if (isNew) {
      const nextNum = 100 + problems.length + 1;
      saved = {
        sys_id: 'prb_' + Math.random().toString(36).substring(2, 9),
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
        sys_id: 'chg_' + Math.random().toString(36).substring(2, 9),
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
    const sys_id = isNew ? 'rec_' + Math.random().toString(36).substring(2, 9) : record.sys_id;
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
      sys_id: isNew ? 'cs_' + Math.random().toString(36).substring(2, 9) : script.sys_id,
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
      sys_id: isNew ? 'br_' + Math.random().toString(36).substring(2, 9) : rule.sys_id,
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
      sys_id: isNew ? 'flow_' + Math.random().toString(36).substring(2, 9) : flow.sys_id,
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
      sys_id: 'req_' + Math.random().toString(36).substring(2, 9),
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
      sys_id: 'act_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const addAttachment = (att: Omit<Attachment, 'sys_id' | 'created_at'>): Attachment => {
    const newAtt: Attachment = {
      ...att,
      sys_id: 'att_' + Math.random().toString(36).substring(2, 9),
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
    setUsers(INITIAL_USERS);
    setGroups(INITIAL_GROUPS);
    setCis(INITIAL_CIS);
    setTables(INITIAL_TABLES);
    setClientScripts(INITIAL_CLIENT_SCRIPTS);
    setBusinessRules(INITIAL_BUSINESS_RULES);
    setFlows(INITIAL_FLOWS);
    setServiceRequests(INITIAL_REQUESTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    localStorage.clear();
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
        impersonateUser,
        endImpersonation,
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
