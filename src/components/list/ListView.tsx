'use client';

import React, { useState, useMemo } from 'react';
import {
  Filter,
  Plus,
  Sliders,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { FilterCondition } from '@/lib/types';
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
    serviceRequests,
    knowledgeArticles,
    customRecords,
    tables,
    openRecord,
    listColumns,
    setListColumnsForTable,
    deleteIncident,
    deleteRecord,
  } = usePlatform();

  // State
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [showSlushbucket, setShowSlushbucket] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('number');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
      default:
        return customRecords[tableName] || [];
    }
  }, [tableName, incidents, problems, changes, cis, users, serviceRequests, knowledgeArticles, customRecords]);

  // Available columns for slushbucket
  const availableColumns = useMemo(() => {
    if (currentTableDef?.columns) {
      return currentTableDef.columns.map((c) => ({ name: c.name, label: c.label }));
    }
    if (rawRecords.length > 0) {
      return Object.keys(rawRecords[0])
        .filter((k) => k !== 'sys_id')
        .map((k) => ({
          name: k,
          label: k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        }));
    }
    return [{ name: 'number', label: 'Number' }];
  }, [currentTableDef, rawRecords]);

  // Selected columns to display
  const activeCols = listColumns[tableName] || availableColumns.slice(0, 7).map((c) => c.name);

  // Helper map for user names
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.sys_id] = u.name;
    });
    return map;
  }, [users]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((record) => {
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
  }, [rawRecords, quickSearchText, columnFilters, conditions]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const copy = [...filteredRecords];
    copy.sort((a, b) => {
      const valA = a[sortColumn] ?? '';
      const valB = b[sortColumn] ?? '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredRecords, sortColumn, sortAsc]);

  // Pagination slice
  const totalCount = sortedRecords.length;
  const startIndex = (currentPage - 1) * pageSize;
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
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<unload unload_date="${new Date().toISOString()}">\n` +
      selectedRowIds
        .map((id) => {
          const rec = rawRecords.find((r) => r.sys_id === id);
          return `  <${tableName}>\n` +
            Object.entries(rec || {})
              .map(([k, v]) => `    <${k}>${typeof v === 'object' ? JSON.stringify(v) : v}</${k}>`)
              .join('\n') +
            `\n  </${tableName}>`;
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
      return userMap[val] || val || '';
    }

    // Clickable link for number / identifier
    if (colName === 'number' || (!record.number && colName === 'name')) {
      return (
        <span
          className="sn-link-record"
          onClick={() => openRecord(tableName, record.sys_id)}
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

          {/* Personalize List Columns (Gear / Slushbucket) */}
          <button
            className="sn-btn sn-btn-default"
            onClick={() => setShowSlushbucket(true)}
            title="Personalize List Columns (Slushbucket)"
          >
            <Sliders size={14} />
          </button>
        </div>
      </div>

      {/* Breadcrumb Bar & Funnel Toggle */}
      <div className="sn-breadcrumbs-bar">
        <button
          className={`sn-funnel-toggle ${showConditionBuilder ? 'active' : ''}`}
          onClick={() => setShowConditionBuilder(!showConditionBuilder)}
          title="Toggle Filter Condition Builder"
        >
          <Filter size={14} />
        </button>

        <span
          className="sn-crumb-chip"
          onClick={() => {
            setConditions([]);
            setColumnFilters({});
            setQuickSearchText('');
          }}
        >
          All
        </span>

        {conditions.map((c, i) => (
          <React.Fragment key={i}>
            <span className="sn-crumb-separator">&gt;</span>
            <span className="sn-crumb-chip">
              {getColLabel(c.field)} {c.operator} {c.value}
            </span>
          </React.Fragment>
        ))}

        {quickSearchText && (
          <>
            <span className="sn-crumb-separator">&gt;</span>
            <span className="sn-crumb-chip">Keyword: &quot;{quickSearchText}&quot;</span>
          </>
        )}
      </div>

      {/* Condition Builder Drawer */}
      {showConditionBuilder && (
        <ConditionBuilder
          conditions={conditions}
          setConditions={setConditions}
          availableFields={availableColumns}
          onRun={() => {}}
          onClear={() => setConditions([])}
        />
      )}

      {/* Main Grid Table */}
      <div className="sn-table-wrapper">
        <table className="sn-table">
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedRowIds.length > 0 && selectedRowIds.length === pagedRecords.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              {activeCols.map((col) => {
                const isSorted = sortColumn === col;
                return (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span>{getColLabel(col)}</span>
                      {isSorted ? (
                        sortAsc ? <ArrowUp size={12} color="#00a389" /> : <ArrowDown size={12} color="#00a389" />
                      ) : (
                        <ArrowUpDown size={11} color="#cbd5e1" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Quick Column Search Filter Row */}
            <tr style={{ background: '#f1f5f9' }}>
              <th />
              {activeCols.map((col) => (
                <th key={col} style={{ padding: '3px 6px' }}>
                  <input
                    type="text"
                    className="sn-col-search-input"
                    placeholder="Search..."
                    value={columnFilters[col] || ''}
                    onChange={(e) =>
                      setColumnFilters({ ...columnFilters, [col]: e.target.value })
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length + 1} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No records match the current filter criteria.
                </td>
              </tr>
            ) : (
              pagedRecords.map((record) => {
                const isSelected = selectedRowIds.includes(record.sys_id);
                return (
                  <tr
                    key={record.sys_id}
                    className={isSelected ? 'selected' : ''}
                    onDoubleClick={() => openRecord(tableName, record.sys_id)}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(record.sys_id)}
                      />
                    </td>
                    {activeCols.map((col) => (
                      <td key={col}>{renderCellValue(record, col)}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* List Footer with Actions & Pagination */}
      <div className="sn-list-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedRowIds.length > 0 && (
            <>
              <span style={{ fontWeight: 600, color: 'var(--now-text-main)' }}>
                {selectedRowIds.length} selected:
              </span>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '3px 8px', fontSize: '11.5px', color: '#dc2626' }}
                onClick={handleDeleteSelected}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '3px 8px', fontSize: '11.5px' }}
                onClick={handleExportXML}
              >
                <Download size={13} />
                <span>Export XML</span>
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>
            {totalCount === 0 ? '0' : startIndex + 1} to{' '}
            {Math.min(startIndex + pageSize, totalCount)} of {totalCount}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="sn-btn sn-btn-default"
              style={{ padding: '3px 8px' }}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              className="sn-btn sn-btn-default"
              style={{ padding: '3px 8px' }}
              disabled={startIndex + pageSize >= totalCount}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Slushbucket Modal for List Customization */}
      {showSlushbucket && (
        <SlushbucketModal
          tableName={tableLabel}
          availableColumns={availableColumns}
          selectedColumns={activeCols}
          onSave={(cols) => setListColumnsForTable(tableName, cols)}
          onClose={() => setShowSlushbucket(false)}
        />
      )}
    </div>
  );
}
