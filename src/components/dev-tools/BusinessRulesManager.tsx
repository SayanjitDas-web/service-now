'use client';

import React, { useState } from 'react';
import { Database, Plus, Check, ArrowLeft } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { BusinessRule } from '@/lib/types';

export default function BusinessRulesManager() {
  const { businessRules, saveBusinessRule, tables } = usePlatform();

  const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form edit fields
  const [name, setName] = useState('');
  const [table, setTable] = useState('incident');
  const [whenTiming, setWhenTiming] = useState<'before' | 'after' | 'async' | 'display'>('before');
  const [insertOp, setInsertOp] = useState(true);
  const [updateOp, setUpdateOp] = useState(true);
  const [deleteOp, setDeleteOp] = useState(false);
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');

  const handleStartNew = () => {
    setSelectedRule(null);
    setName('');
    setTable('incident');
    setWhenTiming('before');
    setInsertOp(true);
    setUpdateOp(true);
    setDeleteOp(false);
    setActive(true);
    setDescription('');
    setScript(`(function executeRule(current, previous /*null when async*/) {
  // Add your server-side logic here
  if (current.impact === '1' && current.urgency === '1') {
    current.priority = '1';
    gs.addInfoMessage('P1 auto-assigned.');
  }
})(current, previous);`);
    setIsEditing(true);
  };

  const handleSelectRule = (br: BusinessRule) => {
    setSelectedRule(br);
    setName(br.name);
    setTable(br.table);
    setWhenTiming(br.when);
    setInsertOp(br.operation.insert);
    setUpdateOp(br.operation.update);
    setDeleteOp(br.operation.delete);
    setActive(br.active);
    setDescription(br.description);
    setScript(br.script);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a Business Rule name.');
      return;
    }

    saveBusinessRule({
      sys_id: selectedRule ? selectedRule.sys_id : 'new',
      name,
      table,
      when: whenTiming,
      operation: {
        insert: insertOp,
        update: updateOp,
        delete: deleteOp,
      },
      active,
      description,
      script,
    });

    setIsEditing(false);
  };

  return (
    <div style={{ padding: '24px', background: 'var(--now-bg-surface)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--now-border)', paddingBottom: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Business Rules (sys_script)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            Server-side database logic executed before or after database insert, update, or delete operations.
          </p>
        </div>

        {!isEditing ? (
          <button className="sn-btn sn-btn-primary" onClick={handleStartNew}>
            <Plus size={14} />
            <span>New Business Rule</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sn-btn sn-btn-default" onClick={() => setIsEditing(false)}>
              <ArrowLeft size={14} />
              <span>Back to List</span>
            </button>
            <button className="sn-btn sn-btn-primary" onClick={handleSave}>
              <Check size={14} />
              <span>Save Business Rule</span>
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Table</th>
              <th>When</th>
              <th>Operations</th>
              <th>Active</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {businessRules.map((br) => {
              const ops = [
                br.operation.insert ? 'Insert' : null,
                br.operation.update ? 'Update' : null,
                br.operation.delete ? 'Delete' : null,
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <tr
                  key={br.sys_id}
                  onClick={() => handleSelectRule(br)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, color: '#0369a1' }}>{br.name}</td>
                  <td>{br.table}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#f1f5f9',
                      }}
                    >
                      {br.when}
                    </span>
                  </td>
                  <td>{ops}</td>
                  <td>{br.active ? 'true' : 'false'}</td>
                  <td style={{ color: 'var(--now-text-muted)' }}>{br.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sn-form-grid">
            <div className="sn-form-group">
              <label className="sn-field-label">Name</label>
              <input
                type="text"
                className="sn-field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incident - Calculate Priority"
              />
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">Table</label>
              <select
                className="sn-field-select"
                value={table}
                onChange={(e) => setTable(e.target.value)}
              >
                {tables.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.label} [{t.name}]
                  </option>
                ))}
              </select>
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">When to run</label>
              <select
                className="sn-field-select"
                value={whenTiming}
                onChange={(e) => setWhenTiming(e.target.value as any)}
              >
                <option value="before">before</option>
                <option value="after">after</option>
                <option value="async">async</option>
                <option value="display">display</option>
              </select>
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">Operations</label>
              <div style={{ display: 'flex', gap: '16px', paddingTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                  <input
                    type="checkbox"
                    checked={insertOp}
                    onChange={(e) => setInsertOp(e.target.checked)}
                    style={{ accentColor: '#00a389' }}
                  />
                  Insert
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                  <input
                    type="checkbox"
                    checked={updateOp}
                    onChange={(e) => setUpdateOp(e.target.checked)}
                    style={{ accentColor: '#00a389' }}
                  />
                  Update
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                  <input
                    type="checkbox"
                    checked={deleteOp}
                    onChange={(e) => setDeleteOp(e.target.checked)}
                    style={{ accentColor: '#00a389' }}
                  />
                  Delete
                </label>
              </div>
            </div>

            <div className="sn-form-group full-width">
              <label className="sn-field-label">Description</label>
              <input
                type="text"
                className="sn-field-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="sn-form-group full-width">
            <label className="sn-field-label">Advanced Script (current, previous, gs)</label>
            <textarea
              className="sn-code-editor"
              rows={12}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
