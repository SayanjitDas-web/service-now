'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  Pin,
  X,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  FileText,
  GitPullRequest,
  ShoppingCart,
  BookOpen,
  Server,
  Users,
  Code2,
  Workflow,
  Terminal,
  Database,
  Layers,
  Sparkles,
  Laptop,
} from 'lucide-react';
import { usePlatform, ActiveViewType } from '@/lib/store';

interface PolarisNavMenuProps {
  navOpenTab: 'all' | 'favorites' | 'history' | 'workspaces' | null;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

interface NavModule {
  title: string;
  icon?: any;
  view: ActiveViewType;
  filterKeywords?: string;
}

interface NavApplication {
  name: string;
  icon: any;
  modules: NavModule[];
}

export default function PolarisNavMenu({
  navOpenTab,
  onClose,
  isPinned,
  onTogglePin,
}: PolarisNavMenuProps) {
  const {
    activeView,
    setActiveView,
    openRecord,
    openList,
    favorites,
    toggleFavorite,
    isFavorite,
    history,
    tables,
    canAccess,
  } = usePlatform();

  const [filterText, setFilterText] = useState('');
  const [collapsedApps, setCollapsedApps] = useState<Record<string, boolean>>({});

  if (!navOpenTab) return null;

  const toggleAppCollapse = (appName: string) => {
    setCollapsedApps((prev) => ({
      ...prev,
      [appName]: !prev[appName],
    }));
  };

  // Dynamic Custom Tables added to navigation
  const customTableModules: NavModule[] = tables
    .filter((t) => t.is_custom)
    .map((t) => ({
      title: t.label,
      view: { type: 'list', table: t.name },
      filterKeywords: `${t.name} ${t.label} custom table`,
    }));

  const applications: NavApplication[] = [
    {
      name: 'Incident',
      icon: AlertCircle,
      modules: [
        {
          title: 'Create New',
          view: { type: 'form', table: 'incident', sys_id: 'new' },
          filterKeywords: 'incident create new ticket new',
        },
        {
          title: 'Open',
          view: { type: 'list', table: 'incident' },
          filterKeywords: 'incident open tickets list',
        },
        {
          title: 'Critical (P1) Incidents',
          view: { type: 'list', table: 'incident' },
          filterKeywords: 'incident critical p1 high severity',
        },
        {
          title: 'All Incidents',
          view: { type: 'list', table: 'incident' },
          filterKeywords: 'incident all list',
        },
      ],
    },
    {
      name: 'Problem',
      icon: FileText,
      modules: [
        {
          title: 'Create New',
          view: { type: 'form', table: 'problem', sys_id: 'new' },
          filterKeywords: 'problem create new prb',
        },
        {
          title: 'Open Problems',
          view: { type: 'list', table: 'problem' },
          filterKeywords: 'problem open list',
        },
      ],
    },
    {
      name: 'Change',
      icon: GitPullRequest,
      modules: [
        {
          title: 'Create New',
          view: { type: 'form', table: 'change_request', sys_id: 'new' },
          filterKeywords: 'change request chg create new',
        },
        {
          title: 'Open Changes',
          view: { type: 'list', table: 'change_request' },
          filterKeywords: 'change open chg list',
        },
      ],
    },
    {
      name: 'Service Catalog',
      icon: ShoppingCart,
      modules: [
        {
          title: 'Service Catalog Home',
          view: { type: 'catalog' },
          filterKeywords: 'catalog request laptop software hardware order',
        },
        {
          title: 'Requests & RITMs',
          view: { type: 'list', table: 'sc_req_item' },
          filterKeywords: 'requests ritm sctask sc_req_item',
        },
      ],
    },
    {
      name: 'Knowledge',
      icon: BookOpen,
      modules: [
        {
          title: 'Knowledge Articles',
          view: { type: 'list', table: 'kb_knowledge' },
          filterKeywords: 'knowledge base kb article documentation',
        },
      ],
    },
    {
      name: 'Configuration (CMDB)',
      icon: Server,
      modules: [
        {
          title: 'Base Configuration Items (CIs)',
          view: { type: 'list', table: 'cmdb_ci' },
          filterKeywords: 'cmdb ci configuration items servers database network',
        },
      ],
    },
    {
      name: 'User Administration',
      icon: Users,
      modules: [
        {
          title: 'Identity Console (users, roles, groups, ACLs)',
          view: { type: 'user_administration' },
          filterKeywords: 'users roles groups acl identity administration sys_user security active lock',
        },
        {
          title: 'Users (sys_user)',
          view: { type: 'list', table: 'sys_user' },
          filterKeywords: 'users user profiles sys_user employees',
        },
      ],
    },
    {
      name: 'System Definition',
      icon: Database,
      modules: [
        {
          title: 'Tables & Columns (sys_db_object)',
          view: { type: 'tables_dictionary' },
          filterKeywords: 'tables dictionary sys_db_object schema columns custom fields',
        },
        {
          title: 'Client Scripts (sys_script_client)',
          view: { type: 'client_scripts' },
          filterKeywords: 'client scripts g_form onload onchange onsubmit js',
        },
        {
          title: 'Business Rules (sys_script)',
          view: { type: 'business_rules' },
          filterKeywords: 'business rules sys_script before after async current previous gs',
        },
      ],
    },
    {
      name: 'Process Automation',
      icon: Workflow,
      modules: [
        {
          title: 'Flow Designer',
          view: { type: 'flow_designer' },
          filterKeywords: 'flow designer automation trigger actions subflow',
        },
      ],
    },
    {
      name: 'System Administration',
      icon: Terminal,
      modules: [
        {
          title: 'Scripts - Background (sys.scripts.do)',
          view: { type: 'script_background' },
          filterKeywords: 'scripts background gliderecord gs print console sys.scripts.do',
        },
        {
          title: 'Update Sets (sys_update_set)',
          view: { type: 'update_sets' },
          filterKeywords: 'update sets default export xml customization sys_update_set',
        },
      ],
    },
    ...(customTableModules.length > 0
      ? [
          {
            name: 'Custom Applications',
            icon: Laptop,
            modules: customTableModules,
          },
        ]
      : []),
  ];

  const isViewAllowed = (view: ActiveViewType): boolean => {
    if (view.type === 'list') return canAccess('list', view.table);
    if (view.type === 'form') return canAccess('form', view.table);
    return canAccess(view.type);
  };

  const handleSelectModule = (view: ActiveViewType) => {
    // Role gate at navigation time; PlatformApp also guards direct view state.
    if (!isViewAllowed(view)) {
      setActiveView(view);
      if (!isPinned) onClose();
      return;
    }
    if (view.type === 'form') {
      openRecord(view.table, view.sys_id);
    } else if (view.type === 'list') {
      openList(view.table);
    } else {
      setActiveView(view);
    }
    if (!isPinned) {
      onClose();
    }
  };

  const isCurrentView = (view: ActiveViewType) => {
    return JSON.stringify(activeView) === JSON.stringify(view);
  };

  return (
    <aside className={`sn-polaris-flyout ${isPinned ? 'pinned' : ''}`}>
      {/* Header bar of the flyout */}
      <div className="sn-nav-filter-box">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            className="sn-filter-input"
            placeholder={
              navOpenTab === 'all'
                ? 'Filter navigator (e.g. incident, scripts)'
                : `Filter ${navOpenTab}...`
            }
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
          />
          <button
            onClick={onTogglePin}
            style={{
              color: isPinned ? '#00a389' : '#94a3b8',
              padding: '4px',
              borderRadius: '3px',
            }}
            title={isPinned ? 'Unpin Navigation' : 'Pin Navigation to workspace'}
          >
            <Pin size={15} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
          </button>
          {!isPinned && (
            <button onClick={onClose} style={{ color: '#94a3b8', padding: '4px' }}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Content according to active tab */}
      <div className="sn-nav-tree">
        {/* TAB 1: ALL Applications & Modules */}
        {navOpenTab === 'all' && (
          <div>
            {applications.map((app) => {
              const isCollapsed = !!collapsedApps[app.name];
              const query = filterText.toLowerCase().trim();

              const matchingModules = app.modules.filter(
                (m) =>
                  isViewAllowed(m.view) &&
                  (!query ||
                    m.title.toLowerCase().includes(query) ||
                    app.name.toLowerCase().includes(query) ||
                    (m.filterKeywords && m.filterKeywords.toLowerCase().includes(query)))
              );

              if (matchingModules.length === 0) {
                return null;
              }

              const Icon = app.icon;

              return (
                <div key={app.name} style={{ marginBottom: '6px' }}>
                  <div
                    className="sn-nav-group-header"
                    onClick={() => toggleAppCollapse(app.name)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={14} color="#00a389" />
                      <span>{app.name}</span>
                    </div>
                    {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </div>

                  {!isCollapsed && (
                    <div>
                      {matchingModules.map((m) => {
                        const active = isCurrentView(m.view);
                        const starred = isFavorite(m.view);

                        return (
                          <div
                            key={m.title}
                            className={`sn-nav-item ${active ? 'active' : ''}`}
                            onClick={() => handleSelectModule(m.view)}
                          >
                            <span>{m.title}</span>
                            <button
                              className={`sn-star-btn ${starred ? 'starred' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite({ title: `${app.name} > ${m.title}`, view: m.view });
                              }}
                              title={starred ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star size={13} fill={starred ? '#f59e0b' : 'none'} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {navOpenTab === 'favorites' && (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Starred Favorites ({favorites.length})
            </div>
            {favorites.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                <Star size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                <p>No favorites starred yet.</p>
                <p style={{ fontSize: '11px', marginTop: '4px' }}>
                  Click the star icon next to any menu module or record to add it here.
                </p>
              </div>
            ) : (
              favorites
                .filter((f) => isViewAllowed(f.view))
                .filter((f) => !filterText || f.title.toLowerCase().includes(filterText.toLowerCase()))
                .map((fav) => (
                  <div
                    key={fav.id}
                    className="sn-nav-item"
                    onClick={() => handleSelectModule(fav.view)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>{fav.title}</span>
                    </div>
                    <button
                      className="sn-star-btn starred"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({ title: fav.title, view: fav.view });
                      }}
                      title="Remove favorite"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {navOpenTab === 'history' && (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Recently Visited
            </div>
            {history
              .filter((h) => isViewAllowed(h.view))
              .filter((h) => !filterText || h.title.toLowerCase().includes(filterText.toLowerCase()))
              .map((h) => (
                <div
                  key={h.id}
                  className="sn-nav-item"
                  onClick={() => handleSelectModule(h.view)}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.title}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>
                    {h.timestamp}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* TAB 4: WORKSPACES */}
        {navOpenTab === 'workspaces' && (
          <div style={{ padding: '12px 16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Next Experience Workspaces
            </div>

            <div
              style={{
                background: 'var(--now-bg-surface-alt)',
                border: '1px solid var(--now-border)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
              onClick={() => {
                openList('incident');
                if (!isPinned) onClose();
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--now-text-main)' }}>
                ITSM Agent Workspace
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--now-text-muted)', marginTop: '4px' }}>
                Multi-tabbed workspace for tier 1-3 support agents managing high volume incident resolution.
              </div>
            </div>

            <div
              style={{
                background: 'var(--now-bg-surface-alt)',
                border: '1px solid var(--now-border)',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
              }}
              onClick={() => {
                openList('cmdb_ci');
                if (!isPinned) onClose();
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--now-text-main)' }}>
                Service Operations Workspace (SOW)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--now-text-muted)', marginTop: '4px' }}>
                Unified visibility into infrastructure health, alerts, CMDB relationships, and active changes.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
