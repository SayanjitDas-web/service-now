'use client';

import React, { useState } from 'react';
import { Database, Plus, Check, ArrowLeft, Table, Layers, ArrowRight } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { TableDefinition, ColumnDefinition } from '@/lib/types';

export default function TablesDictionary() {
  const { tables, createCustomTable, openList } = usePlatform();

  const [selectedTable, setSelectedTable] = useState<TableDefinition | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Table inputs
  const [newLabel, setNewLabel] = useState('');
  const [newName, setNewName] = useState('u_');
  const [superClass, setSuperClass] = useState('task');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: 'u_name', label: 'Item Name', type: 'string', mandatory: true },
    { name: 'u_assigned_to', label: 'Assigned User', type: 'reference', reference_table: 'sys_user' },
  ]);

  const handleLabelChange = (lbl: string) => {
    setNewLabel(lbl);
    const slug = lbl
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    setNewName(`u_${slug}`);
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: `u_field_${columns.length + 1}`,
        label: `Custom Field ${columns.length + 1}`,
        type: 'string',
      },
    ]);
  };

  const handleColumnUpdate = (index: number, key: keyof ColumnDefinition, val: any) => {
    const copy = [...columns];
    copy[index] = { ...copy[index], [key]: val };
    setColumns(copy);
  };

  const handleSaveTable = () => {
    if (!newLabel.trim() || !newName.trim()) {
      alert('Please provide a Table Label and Name.');
      return;
    }

    const newTbl: TableDefinition = {
      sys_id: 'tbl_' + Math.random().toString(36).substring(2, 9),
      label: newLabel,
      name: newName,
      super_class: superClass,
      is_custom: true,
      columns: [
        { name: 'number', label: 'Number', type: 'string', read_only: true },
        ...columns,
      ],
      sys_created_on: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    createCustomTable(newTbl);
    setIsCreatingNew(false);
    openList(newTbl.name);
  };

  return (
    <div style={{ padding: '24px', background: 'var(--now-bg-surface)', minHeight: '100%' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--now-border)', paddingBottom: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Tables & Columns (sys_db_object)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            ServiceNow Data Dictionary. Inspect platform schemas, base tables, and create custom tables with automatic `u_` namespace.
          </p>
        </div>

        {!isCreatingNew && !selectedTable && (
          <button className="sn-btn sn-btn-primary" onClick={() => setIsCreatingNew(true)}>
            <Plus size={14} />
            <span>New Custom Table</span>
          </button>
        )}

        {(isCreatingNew || selectedTable) && (
          <button
            className="sn-btn sn-btn-default"
            onClick={() => {
              setIsCreatingNew(false);
              setSelectedTable(null);
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Tables</span>
          </button>
        )}
      </div>

      {/* VIEW 1: All Tables */}
      {!isCreatingNew && !selectedTable && (
        <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
          <thead>
            <tr>
              <th>Label</th>
              <th>Name</th>
              <th>Extends (Super Class)</th>
              <th>Type</th>
              <th>Columns Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.sys_id} onClick={() => setSelectedTable(t)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600, color: '#0369a1' }}>{t.label}</td>
                <td>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>
                    {t.name}
                  </code>
                </td>
                <td>{t.super_class || 'None'}</td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: t.is_custom ? '#fef3c7' : '#e0f2fe',
                      color: t.is_custom ? '#b45309' : '#0369a1',
                    }}
                  >
                    {t.is_custom ? 'Custom Table' : 'Base System'}
                  </span>
                </td>
                <td>{t.columns.length} columns</td>
                <td>
                  <button
                    className="sn-btn sn-btn-default"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openList(t.name);
                    }}
                  >
                    <span>View List</span>
                    <ArrowRight size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* VIEW 2: Table Columns Inspector */}
      {selectedTable && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{selectedTable.label} [{selectedTable.name}]</h2>
              <div style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>
                Extends: {selectedTable.super_class || 'Base object'} • Created: {selectedTable.sys_created_on}
              </div>
            </div>
            <button className="sn-btn sn-btn-primary" onClick={() => openList(selectedTable.name)}>
              Open {selectedTable.label} List
            </button>
          </div>

          <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
            <thead>
              <tr>
                <th>Column Label</th>
                <th>Column Name</th>
                <th>Type</th>
                <th>Reference Target</th>
                <th>Mandatory</th>
                <th>Read Only</th>
              </tr>
            </thead>
            <tbody>
              {selectedTable.columns.map((col) => (
                <tr key={col.name}>
                  <td style={{ fontWeight: 600 }}>{col.label}</td>
                  <td><code>{col.name}</code></td>
                  <td>
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                      {col.type}
                    </span>
                  </td>
                  <td>{col.reference_table || '—'}</td>
                  <td>{col.mandatory ? <span style={{ color: '#dc2626', fontWeight: 700 }}>true</span> : 'false'}</td>
                  <td>{col.read_only ? 'true' : 'false'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: Create New Custom Table Form */}
      {isCreatingNew && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="sn-form-grid">
            <div className="sn-form-group">
              <label className="sn-field-label">
                <span className="sn-mandatory-asterisk">*</span>
                Table Label
              </label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="e.g. Office Visitor Badge"
                value={newLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
              />
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">
                <span className="sn-mandatory-asterisk">*</span>
                Table Name (Prefixed with u_)
              </label>
              <input
                type="text"
                className="sn-field-input read-only"
                value={newName}
                readOnly
              />
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">Extends Table</label>
              <select
                className="sn-field-select"
                value={superClass}
                onChange={(e) => setSuperClass(e.target.value)}
              >
                <option value="task">Task (task)</option>
                <option value="cmdb_ci">Configuration Item (cmdb_ci)</option>
                <option value="none">None (Standalone)</option>
              </select>
            </div>
          </div>

          {/* Columns Editor */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Custom Columns Dictionary</span>
              <button className="sn-btn sn-btn-default" onClick={handleAddColumn}>
                <Plus size={13} />
                <span>Add Column</span>
              </button>
            </div>

            <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
              <thead>
                <tr>
                  <th>Column Label</th>
                  <th>Column Name</th>
                  <th>Type</th>
                  <th>Reference Target</th>
                  <th>Mandatory</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="sn-field-input"
                        value={col.label}
                        onChange={(e) => handleColumnUpdate(idx, 'label', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sn-field-input"
                        value={col.name}
                        onChange={(e) => handleColumnUpdate(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="sn-field-select"
                        value={col.type}
                        onChange={(e) => handleColumnUpdate(idx, 'type', e.target.value)}
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">True/False (Boolean)</option>
                        <option value="datetime">Date/Time</option>
                        <option value="reference">Reference</option>
                      </select>
                    </td>
                    <td>
                      {col.type === 'reference' ? (
                        <select
                          className="sn-field-select"
                          value={col.reference_table || 'sys_user'}
                          onChange={(e) => handleColumnUpdate(idx, 'reference_table', e.target.value)}
                        >
                          <option value="sys_user">sys_user</option>
                          <option value="cmdb_ci">cmdb_ci</option>
                          <option value="sys_user_group">sys_user_group</option>
                        </select>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!col.mandatory}
                        onChange={(e) => handleColumnUpdate(idx, 'mandatory', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="sn-btn sn-btn-default" onClick={() => setIsCreatingNew(false)}>
              Cancel
            </button>
            <button className="sn-btn sn-btn-primary" onClick={handleSaveTable}>
              <Check size={14} />
              <span>Create Table & Schema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
