'use client';

import React, { useState, useMemo } from 'react';
import {
  Filter,
  Plus,
  Sliders,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { FilterCondition } from '@/lib/types';
import { isUserMatch, isUserInGroup } from '@/lib/authUtils';
import ConditionBuilder from './ConditionBuilder';
import SlushbucketModal from './SlushbucketModal';

interface ListViewProps {
  tableName: string;
}

export default function ListView({ tableName }: ListViewProps) {
  const {
    incidents,
    problems,
    changes,
    cis,
    users,
    groups,
    serviceRequests,
    knowledgeArticles,
    customRecords,
    tables,
    openRecord,
    listColumns,
    setListColumnsForTable,
    deleteRecord,
    clearTableData,
    loadDemoData,
    currentUser,
    activeView,
  } = usePlatform();

  // State
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [showSlushbucket, setShowSlushbucket] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('sys_created_on');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync with activeView filter preset if available
  const viewPreset = activeView.type === 'list' ? activeView.filterPreset : undefined;
  const [selectedPreset, setSelectedPreset] = useState<string>(viewPreset || 'all');
  const [prevViewPreset, setPrevViewPreset] = useState(viewPreset);

  if (viewPreset !== prevViewPreset) {
    setPrevViewPreset(viewPreset);
    setSelectedPreset(viewPreset || 'all');
    setCurrentPage(1);
  }

  // Track table switch during render without useEffect cascading renders
  const [prevTable, setPrevTable] = useState(tableName);
  if (prevTable !== tableName) {
    setPrevTable(tableName);
    setCurrentPage(1);
    setSelectedRowIds([]);
    setQuickSearchText('');
    setColumnFilters({});
    setConditions([]);
  }

  // Determine current table schema & records
  const currentTableDef = tables.find((t) => t.name === tableName);
  const tableLabel = currentTableDef?.label || tableName;

  // Retrieve data source
  const rawRecords: any[] = useMemo(() => {
    switch (tableName) {
      case 'incident':
        return incidents;
      case 'problem':
        return problems;
      case 'change_request':
        return changes;
      case 'cmdb_ci':
        return cis;
      case 'sys_user':
        return users;
      case 'sc_req_item':
        return serviceRequests;
      case 'kb_knowledge':
        return knowledgeArticles;
      case 'task':
        // Polymorphic ServiceNow task table combining all ITSM and Catalog tasks
        return [
          ...incidents.map((i) => ({
            ...i,
            task_type: 'Incident',
            sys_class_name: 'incident',
          })),
          ...problems.map((p) => ({
            ...p,
            task_type: 'Problem',
            sys_class_name: 'problem',
          })),
          ...changes.map((c) => ({
            ...c,
            task_type: 'Change Request',
            sys_class_name: 'change_request',
          })),
          ...serviceRequests.map((r) => ({
            ...r,
            task_type: 'Catalog Task',
            sys_class_name: 'sc_req_item',
            short_description: r.short_description || `${r.catalog_item_name} (${r.ritm_number})`,
            priority: '3',
          })),
        ];
      default:
        return customRecords[tableName] || [];
    }
  }, [tableName, incidents, problems, changes, cis, users, serviceRequests, knowledgeArticles, customRecords]);

  // Tab presets configuration
  const incidentPresets = useMemo(() => [
    { id: 'all', label: 'All Incidents', count: rawRecords.length },
    {
      id: 'assigned_to_me',
      label: 'Assigned to Me',
      count: rawRecords.filter((r) => isUserMatch(r.assigned_to, currentUser, users)).length,
    },
    {
      id: 'my_incidents',
      label: 'My Incidents',
      count: rawRecords.filter((r) => isUserMatch(r.caller_id, currentUser, users)).length,
    },
    {
      id: 'open',
      label: 'Open',
      count: rawRecords.filter((r) => r.state !== '7' && r.state !== '8').length,
    },
    {
      id: 'p1',
      label: 'Critical (P1)',
      count: rawRecords.filter((r) => r.priority === '1').length,
    },
  ], [rawRecords, currentUser, users]);

  const problemPresets = useMemo(() => [
    { id: 'all', label: 'All Problems', count: rawRecords.length },
    {
      id: 'assigned_to_me',
      label: 'Assigned to Me',
      count: rawRecords.filter((r) => isUserMatch(r.assigned_to, currentUser, users)).length,
    },
    {
      id: 'open',
      label: 'Open Problems',
      count: rawRecords.filter((r) => r.state !== '4' && r.state !== 'Closed').length,
    },
  ], [rawRecords, currentUser, users]);

  const changePresets = useMemo(() => [
    { id: 'all', label: 'All Changes', count: rawRecords.length },
    {
      id: 'assigned_to_me',
      label: 'Assigned to Me',
      count: rawRecords.filter((r) => isUserMatch(r.assigned_to, currentUser, users)).length,
    },
    {
      id: 'open',
      label: 'Open Changes',
      count: rawRecords.filter((r) => r.state !== 'Closed').length,
    },
  ], [rawRecords, currentUser, users]);

  const requestPresets = useMemo(() => [
    { id: 'all', label: 'All Requests', count: rawRecords.length },
    {
      id: 'assigned_to_me',
      label: 'Assigned to Me (Fulfillment)',
      count: rawRecords.filter((r) => isUserMatch(r.assigned_to, currentUser, users)).length,
    },
    {
      id: 'my_requests',
      label: 'My Requests (Delivered to me)',
      count: rawRecords.filter(
        (r) =>
          isUserMatch(r.requested_for, currentUser, users) ||
          isUserMatch(r.requested_by, currentUser, users)
      ).length,
    },
    {
      id: 'open',
      label: 'Open Requests',
      count: rawRecords.filter((r) => r.stage !== 'Completed' && r.stage !== 'Closed Incomplete').length,
    },
  ], [rawRecords, currentUser, users]);

  const taskPresets = useMemo(() => [
    { id: 'all', label: 'All Tasks', count: rawRecords.length },
    {
      id: 'assigned_to_me',
      label: 'Assigned to Me (My Work)',
      count: rawRecords.filter((r) => isUserMatch(r.assigned_to, currentUser, users)).length,
    },
    {
      id: 'my_groups_work',
      label: 'My Groups Work',
      count: rawRecords.filter((r) => isUserInGroup(currentUser, r.assignment_group, groups)).length,
    },
    {
      id: 'open',
      label: 'Open Tasks',
      count: rawRecords.filter((r) => r.state !== '7' && r.state !== '8' && r.state !== 'Closed' && r.state !== '4' && r.stage !== 'Completed').length,
    },
  ], [rawRecords, currentUser, users, groups]);

  const currentPresets = useMemo(() => {
    if (tableName === 'incident') return incidentPresets;
    if (tableName === 'problem') return problemPresets;
    if (tableName === 'change_request') return changePresets;
    if (tableName === 'sc_req_item') return requestPresets;
    if (tableName === 'task') return taskPresets;
    return null;
  }, [tableName, incidentPresets, problemPresets, changePresets, requestPresets, taskPresets]);

  // Available columns for slushbucket
  const availableColumns = useMemo(() => {
    if (tableName === 'task') {
      return [
        { name: 'number', label: 'Number' },
        { name: 'task_type', label: 'Task Type' },
        { name: 'priority', label: 'Priority' },
        { name: 'state', label: 'State' },
        { name: 'short_description', label: 'Short description' },
        { name: 'assigned_to', label: 'Assigned to' },
        { name: 'assignment_group', label: 'Assignment group' },
        { name: 'sys_updated_on', label: 'Updated' },
      ];
    }
    if (currentTableDef?.columns) {
      return currentTableDef.columns.map((c) => ({ name: c.name, label: c.label }));
    }
    if (rawRecords.length > 0) {
      return Object.keys(rawRecords[0])
        .filter((k) => k !== 'sys_id' && k !== 'sys_class_name')
        .map((k) => ({
          name: k,
          label: k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        }));
    }
    return [{ name: 'number', label: 'Number' }];
  }, [tableName, currentTableDef, rawRecords]);

  // Selected columns to display
  const activeCols = listColumns[tableName] || availableColumns.slice(0, 7).map((c) => c.name);

  // Helper map for user names
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.sys_id] = u.name;
      map[u.user_name] = u.name;
      map[u.name] = u.name;
      map[u.sys_id.toLowerCase()] = u.name;
      map[u.user_name.toLowerCase()] = u.name;
      map[u.name.toLowerCase()] = u.name;
      if (u.email) {
        map[u.email] = u.name;
        map[u.email.toLowerCase()] = u.name;
      }
    });
    return map;
  }, [users]);

  // Filter records
  const filteredRecords = useMemo(() => {
    // 1. Apply preset filter
    let base = rawRecords;
    if (selectedPreset === 'assigned_to_me') {
      base = base.filter((r) => isUserMatch(r.assigned_to, currentUser, users));
    } else if (selectedPreset === 'my_incidents') {
      base = base.filter((r) => isUserMatch(r.caller_id, currentUser, users));
    } else if (selectedPreset === 'my_requests') {
      base = base.filter(
        (r) =>
          isUserMatch(r.requested_for, currentUser, users) ||
          isUserMatch(r.requested_by, currentUser, users)
      );
    } else if (selectedPreset === 'my_groups_work') {
      base = base.filter((r) => isUserInGroup(currentUser, r.assignment_group, groups));
    } else if (selectedPreset === 'open') {
      base = base.filter(
        (r) =>
          r.state !== '7' &&
          r.state !== '8' &&
          r.state !== 'Closed' &&
          r.state !== '4' &&
          r.stage !== 'Completed' &&
          r.stage !== 'Closed Incomplete'
      );
    } else if (selectedPreset === 'p1') {
      base = base.filter((r) => r.priority === '1');
    }

    return base.filter((record) => {
      // Global quick search
      if (quickSearchText) {
        const match = Object.values(record).some((v) =>
          String(v || '').toLowerCase().includes(quickSearchText.toLowerCase())
        );
        if (!match) return false;
      }

      // Column filters
      for (const [col, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal) continue;
        const val = String(record[col] || '').toLowerCase();
        if (!val.includes(filterVal.toLowerCase())) return false;
      }

      // Condition builder conditions
      for (const cond of conditions) {
        if (!cond.value && cond.operator !== 'is_empty') continue;
        const val = record[cond.field];
        const strVal = String(val ?? '').toLowerCase();
        const condVal = String(cond.value).toLowerCase();

        switch (cond.operator) {
          case 'is':
            if (strVal !== condVal) return false;
            break;
          case 'is_not':
            if (strVal === condVal) return false;
            break;
          case 'contains':
            if (!strVal.includes(condVal)) return false;
            break;
          case 'not_contains':
            if (strVal.includes(condVal)) return false;
            break;
          case 'starts_with':
            if (!strVal.startsWith(condVal)) return false;
            break;
          case 'greater_than':
            if (val <= cond.value) return false;
            break;
          case 'less_than':
            if (val >= cond.value) return false;
            break;
          case 'is_empty':
            if (val !== undefined && val !== null && val !== '') return false;
            break;
        }
      }

      return true;
    });
  }, [rawRecords, tableName, selectedPreset, currentUser, users, groups, quickSearchText, columnFilters, conditions]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const copy = [...filteredRecords];
    copy.sort((a, b) => {
      const valA = a[sortColumn] ?? '';
      const valB = b[sortColumn] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return sortAsc ? comp : -comp;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredRecords, sortColumn, sortAsc]);

  // Pagination bounds & slice
  const totalCount = sortedRecords.length;
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, maxPage);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRecords = sortedRecords.slice(startIndex, startIndex + pageSize);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(columnName);
      setSortAsc(true);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(pagedRecords.map((r) => r.sys_id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRow = (sys_id: string) => {
    if (selectedRowIds.includes(sys_id)) {
      setSelectedRowIds(selectedRowIds.filter((id) => id !== sys_id));
    } else {
      setSelectedRowIds([...selectedRowIds, sys_id]);
    }
  };

  const handleDeleteSelected = () => {
    if (confirm(`Are you sure you want to delete ${selectedRowIds.length} selected record(s)?`)) {
      selectedRowIds.forEach((id) => deleteRecord(tableName, id));
      setSelectedRowIds([]);
    }
  };

  const handleExportXML = () => {
    const xmlContent =
      `<?xml version="1.0" encoding="UTF-8"?>\n<unload unload_date="${new Date().toISOString()}">\n` +
      selectedRowIds
        .map((id) => {
          const rec = rawRecords.find((r) => r.sys_id === id);
          return (
            `  <${tableName}>\n` +
            Object.entries(rec || {})
              .map(([k, v]) => `    <${k}>${typeof v === 'object' ? JSON.stringify(v) : v}</${k}>`)
              .join('\n') +
            `\n  </${tableName}>`
          );
        })
        .join('\n') +
      `\n</unload>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_export.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper formatting for cell value
  const renderCellValue = (record: any, colName: string) => {
    const val = record[colName];

    // Priority badge
    if (colName === 'priority') {
      const pLabels: Record<string, string> = {
        '1': '1 - Critical',
        '2': '2 - High',
        '3': '3 - Moderate',
        '4': '4 - Low',
        '5': '5 - Planning',
      };
      return (
        <span className={`sn-badge sn-badge-p${val}`}>
          {pLabels[val] || val}
        </span>
      );
    }

    // State badge
    if (colName === 'state' && tableName === 'incident') {
      const stateMap: Record<string, { label: string; cls: string }> = {
        '1': { label: 'New', cls: 'sn-badge-p4' },
        '2': { label: 'In Progress', cls: 'sn-badge-inprogress' },
        '3': { label: 'On Hold', cls: 'sn-badge-onhold' },
        '6': { label: 'Resolved', cls: 'sn-badge-resolved' },
        '7': { label: 'Closed', cls: 'sn-badge-p5' },
        '8': { label: 'Canceled', cls: 'sn-badge-p5' },
      };
      const info = stateMap[val] || { label: val, cls: 'sn-badge-p4' };
      return <span className={`sn-badge ${info.cls}`}>{info.label}</span>;
    }

    // User references
    if (['caller_id', 'assigned_to', 'resolved_by', 'requested_for', 'requested_by'].includes(colName)) {
      const id = typeof val === 'object' && val !== null ? ((val as any).name || (val as any).user_name || (val as any).sys_id || '') : String(val || '');
      return userMap[id] || userMap[id.toLowerCase()] || id || '';
    }

    // Clickable link for number / identifier
    if (colName === 'number' || (!record.number && colName === 'name')) {
      const targetTable = tableName === 'task' ? (record.sys_class_name || 'incident') : tableName;
      return (
        <span
          className="sn-link-record"
          onClick={() => openRecord(targetTable, record.sys_id)}
        >
          {val}
        </span>
      );
    }

    return String(val ?? '');
  };

  const getColLabel = (colName: string) => {
    const found = availableColumns.find((c) => c.name === colName);
    return found ? found.label : colName;
  };

  const getColStyle = (colName: string): React.CSSProperties => {
    switch (colName) {
      case 'number':
        return { width: '135px', minWidth: '125px' };
      case 'priority':
        return { width: '105px', minWidth: '95px' };
      case 'state':
        return { width: '115px', minWidth: '105px' };
      case 'short_description':
        return { minWidth: '280px' };
      case 'caller_id':
      case 'opened_by':
      case 'assigned_to':
      case 'requested_for':
      case 'requested_by':
        return { width: '150px', minWidth: '135px' };
      case 'sys_updated_on':
      case 'sys_created_on':
        return { width: '155px', minWidth: '140px' };
      case 'category':
      case 'impact':
      case 'urgency':
        return { width: '110px', minWidth: '100px' };
      default:
        return { minWidth: '125px' };
    }
  };

  return (
    <div className="sn-list-container">
      {/* List Header Bar */}
      <div className="sn-list-header">
        <div className="sn-list-title-row">
          <h1 className="sn-list-title">{tableLabel}</h1>
          <span className="sn-list-count">({totalCount} records)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--now-border)',
              borderRadius: 'var(--now-radius-sm)',
              padding: '3px 8px',
              background: 'var(--now-bg-surface)',
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${tableLabel}...`}
              value={quickSearchText}
              onChange={(e) => setQuickSearchText(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                marginLeft: '6px',
                fontSize: '12px',
                width: '160px',
                color: 'var(--now-text-main)',
              }}
            />
          </div>

          {/* New Record Button */}
          <button
            className="sn-btn sn-btn-primary"
            onClick={() => openRecord(tableName, 'new')}
            title={`Create new ${tableLabel}`}
          >
            <Plus size={14} />
            <span>New</span>
          </button>

          {/* Clear Table Records Button */}
          {rawRecords.length > 0 && (
            <button
              className="sn-btn sn-btn-default"
              onClick={() => {
                if (
                  confirm(
                    `Clear all ${rawRecords.length} record(s) from ${tableLabel}? This removes existing records.`
                  )
                ) {
                  clearTableData(tableName);
                  setSelectedRowIds([]);
                }
              }}
              title={`Clear all ${tableLabel} records`}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <Trash2 size={13} />
              <span>Clear Data</span>
            </button>
          )}

          {/* Personalize List Columns (Gear / Slushbucket) */}
          <button
            className="sn-btn sn-btn-default"
            onClick={() => setShowSlushbucket(true)}
            title="Personalize List Columns"
          >
            <Sliders size={13} />
          </button>

          {/* Filter / Condition Builder Toggle */}
          <button
            className={`sn-btn ${showConditionBuilder ? 'sn-btn-primary' : 'sn-btn-default'}`}
            onClick={() => setShowConditionBuilder(!showConditionBuilder)}
            title="Toggle Condition Filter Builder"
          >
            <Filter size={13} />
            <span>Filter</span>
            {conditions.length > 0 && (
              <span
                style={{
                  background: '#00a389',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  marginLeft: '4px',
                }}
              >
                {conditions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Preset View Filter Tabs for Task-based tables */}
      {currentPresets && currentPresets.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', padding: '6px 16px', background: '#ffffff', borderBottom: '1px solid var(--now-border)', overflowX: 'auto', alignItems: 'center' }}>
          {currentPresets.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.id);
                  setCurrentPage(1);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: '16px',
                  border: isActive ? '1px solid #008770' : '1px solid #e2e8f0',
                  background: isActive ? '#008770' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span>{preset.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                    color: isActive ? '#ffffff' : '#1e293b',
                    fontWeight: 700,
                  }}
                >
                  {preset.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Condition Builder Drawer */}
      {showConditionBuilder && (
        <ConditionBuilder
          availableFields={availableColumns}
          conditions={conditions}
          setConditions={setConditions}
          onRun={() => setShowConditionBuilder(false)}
          onClear={() => setConditions([])}
        />
      )}

      {/* Bulk Action Controls */}
      {selectedRowIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--now-bg-surface)',
            borderBottom: '1px solid var(--now-border)',
            padding: '6px 14px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600 }}>{selectedRowIds.length} row(s) selected</span>
            <button
              className="sn-btn sn-btn-default"
              onClick={handleDeleteSelected}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
            <button className="sn-btn sn-btn-default" onClick={handleExportXML}>
              <Download size={13} />
              <span>Export Selected (XML)</span>
            </button>
          </div>
          <button
            className="sn-link-record"
            style={{ fontSize: '11.5px' }}
            onClick={() => setSelectedRowIds([])}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="sn-table-wrapper">
        <table className="sn-table">
          <thead>
            <tr>
              {/* Select All Checkbox Column */}
              <th style={{ width: '38px', minWidth: '38px', maxWidth: '38px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={
                    pagedRecords.length > 0 &&
                    pagedRecords.every((r) => selectedRowIds.includes(r.sys_id))
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>

              {/* Data Columns */}
              {activeCols.map((colName) => {
                const isSorted = sortColumn === colName;
                const colStyle = getColStyle(colName);
                return (
                  <th
                    key={colName}
                    onClick={() => handleSort(colName)}
                    style={{ ...colStyle, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getColLabel(colName)}
                      </span>
                      <span style={{ color: isSorted ? 'var(--now-primary)' : '#94a3b8', flexShrink: 0 }}>
                        {isSorted ? (
                          sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={11} />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* In-Line Column Filter Row */}
            <tr className="sn-table-filter-row">
              <th style={{ width: '38px', minWidth: '38px', maxWidth: '38px', textAlign: 'center' }}>
                <Filter size={11} color="#94a3b8" />
              </th>
              {activeCols.map((colName) => {
                const colStyle = getColStyle(colName);
                return (
                  <th key={`filter_${colName}`} style={colStyle}>
                    <input
                      type="text"
                      className="sn-col-filter-input"
                      placeholder={`Search ${getColLabel(colName)}...`}
                      value={columnFilters[colName] || ''}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, [colName]: e.target.value })
                      }
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pagedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={activeCols.length + 1}
                  style={{ textAlign: 'center', padding: '56px 16px', background: '#ffffff' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--now-text-main)' }}>
                      No {tableLabel} records found
                    </div>
                    {rawRecords.length > 0 ? (
                      <>
                        <div style={{ fontSize: '12.5px', color: 'var(--now-text-muted)', maxWidth: '460px', lineHeight: 1.5 }}>
                          There are <strong>{rawRecords.length}</strong> total {tableLabel.toLowerCase()} records, but none match the current filter preset (<strong>{selectedPreset}</strong>) or search filters.
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            className="sn-btn sn-btn-primary"
                            onClick={() => {
                              setSelectedPreset('all');
                              setQuickSearchText('');
                              setColumnFilters({});
                              setConditions([]);
                              setCurrentPage(1);
                            }}
                          >
                            <span>Show All {tableLabel} Records</span>
                          </button>
                          <button
                            className="sn-btn sn-btn-default"
                            onClick={() => openRecord(tableName === 'task' ? 'incident' : tableName, 'new')}
                          >
                            <Plus size={14} />
                            <span>New {tableLabel}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '12.5px', color: 'var(--now-text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
                          Click <strong>&quot;New&quot;</strong> to create a new {tableLabel.toLowerCase()} record, or load realistic sample data.
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            className="sn-btn sn-btn-primary"
                            onClick={() => openRecord(tableName === 'task' ? 'incident' : tableName, 'new')}
                          >
                            <Plus size={14} />
                            <span>New {tableLabel}</span>
                          </button>
                          <button
                            className="sn-btn sn-btn-default"
                            onClick={() => loadDemoData(tableName === 'task' ? undefined : tableName)}
                            title="Load realistic sample ServiceNow records for testing"
                          >
                            <Database size={14} />
                            <span>Load Sample Data</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pagedRecords.map((record) => {
                const isSelected = selectedRowIds.includes(record.sys_id);
                return (
                  <tr
                    key={record.sys_id}
                    className={isSelected ? 'selected' : ''}
                    onDoubleClick={() =>
                      openRecord(tableName === 'task' ? (record.sys_class_name || 'incident') : tableName, record.sys_id)
                    }
                  >
                    <td style={{ width: '38px', minWidth: '38px', maxWidth: '38px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(record.sys_id)}
                      />
                    </td>
                    {activeCols.map((colName) => {
                      const colStyle = getColStyle(colName);
                      return (
                        <td key={`${record.sys_id}_${colName}`} style={colStyle}>
                          {renderCellValue(record, colName)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="sn-list-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                marginLeft: '6px',
                padding: '2px 4px',
                border: '1px solid var(--now-border)',
                borderRadius: '4px',
                background: 'var(--now-bg-surface)',
                color: 'var(--now-text-main)',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </span>
          <span>
            {totalCount > 0 ? `${startIndex + 1} - ${Math.min(startIndex + pageSize, totalCount)}` : '0'}{' '}
            of {totalCount}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="sn-btn sn-btn-default"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
            <span>Previous</span>
          </button>
          <span style={{ padding: '0 6px', fontWeight: 600 }}>
            Page {safePage} of {maxPage}
          </span>
          <button
            className="sn-btn sn-btn-default"
            disabled={safePage >= maxPage}
            onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Slushbucket Column Customizer Modal */}
      {showSlushbucket && (
        <SlushbucketModal
          tableName={tableName}
          availableColumns={availableColumns}
          selectedColumns={activeCols}
          onSave={(newCols) => {
            setListColumnsForTable(tableName, newCols);
            setShowSlushbucket(false);
          }}
          onClose={() => setShowSlushbucket(false)}
        />
      )}
    </div>
  );
}
