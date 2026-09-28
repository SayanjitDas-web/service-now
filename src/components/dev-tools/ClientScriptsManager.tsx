'use client';

import React, { useState } from 'react';
import { Code2, Plus, Check, Play, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { ClientScript } from '@/lib/types';

export default function ClientScriptsManager() {
  const { clientScripts, saveClientScript, tables, openRecord } = usePlatform();

  const [selectedScript, setSelectedScript] = useState<ClientScript | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form edit fields
  const [name, setName] = useState('');
  const [table, setTable] = useState('incident');
  const [type, setType] = useState<'onLoad' | 'onChange' | 'onSubmit'>('onChange');
  const [fieldName, setFieldName] = useState('priority');
  const [uiType, setUiType] = useState<'Desktop' | 'Mobile / Service Portal' | 'All'>('All');
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');

  const handleStartNew = () => {
    setSelectedScript(null);
    setName('');
    setTable('incident');
    setType('onChange');
    setFieldName('priority');
    setUiType('All');
    setActive(true);
    setDescription('');
    setScript(`function onChange(control, oldValue, newValue, isLoading) {
  if (isLoading || newValue === '') {
    return;
  }

  // Type appropriate comment here, and begin script below
  if (newValue === '1') {
    g_form.addErrorMessage('High severity ticket alert!');
  }
}`);
    setIsEditing(true);
  };

  const handleSelectScript = (cs: ClientScript) => {
    setSelectedScript(cs);
    setName(cs.name);
    setTable(cs.table);
    setType(cs.type);
    setFieldName(cs.field_name || '');
    setUiType(cs.ui_type);
    setActive(cs.active);
    setDescription(cs.description);
    setScript(cs.script);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a Client Script name.');
      return;
    }

    saveClientScript({
      sys_id: selectedScript ? selectedScript.sys_id : 'new',
      name,
      table,
      type,
      field_name: type === 'onChange' ? fieldName : undefined,
      ui_type: uiType,
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
            <Code2 size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Client Scripts (sys_script_client)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            Manage client-side JavaScript behaviors executed in browser forms (g_form API, field validation, dynamic show/hide).
          </p>
        </div>

        {!isEditing ? (
          <button className="sn-btn sn-btn-primary" onClick={handleStartNew}>
            <Plus size={14} />
            <span>New Client Script</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sn-btn sn-btn-default" onClick={() => setIsEditing(false)}>
              <ArrowLeft size={14} />
              <span>Back to List</span>
            </button>
            <button className="sn-btn sn-btn-primary" onClick={handleSave}>
              <Check size={14} />
              <span>Save Script</span>
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        /* List of Client Scripts */
        <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Table</th>
              <th>Type</th>
              <th>Field name</th>
              <th>Active</th>
              <th>UI Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {clientScripts.map((cs) => (
              <tr
                key={cs.sys_id}
                onClick={() => handleSelectScript(cs)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ fontWeight: 600, color: '#0369a1' }}>{cs.name}</td>
                <td>{cs.table}</td>
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
                    {cs.type}
                  </span>
                </td>
                <td>{cs.field_name || '—'}</td>
                <td>{cs.active ? 'true' : 'false'}</td>
                <td>{cs.ui_type}</td>
                <td style={{ color: 'var(--now-text-muted)' }}>{cs.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* Edit Form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sn-form-grid">
            <div className="sn-form-group">
              <label className="sn-field-label">Name</label>
              <input
                type="text"
                className="sn-field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incident - Require Close Notes"
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
              <label className="sn-field-label">Type</label>
              <select
                className="sn-field-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="onLoad">onLoad</option>
                <option value="onChange">onChange</option>
                <option value="onSubmit">onSubmit</option>
              </select>
            </div>

            {type === 'onChange' && (
              <div className="sn-form-group">
                <label className="sn-field-label">Field name</label>
                <select
                  className="sn-field-select"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                >
                  <option value="priority">Priority</option>
                  <option value="state">State</option>
                  <option value="impact">Impact</option>
                  <option value="urgency">Urgency</option>
                  <option value="category">Category</option>
                  <option value="caller_id">Caller</option>
                </select>
              </div>
            )}

            <div className="sn-form-group">
              <label className="sn-field-label">UI Type</label>
              <select
                className="sn-field-select"
                value={uiType}
                onChange={(e) => setUiType(e.target.value as any)}
              >
                <option value="All">All</option>
                <option value="Desktop">Desktop</option>
                <option value="Mobile / Service Portal">Mobile / Service Portal</option>
              </select>
            </div>

            <div className="sn-form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
              <input
                type="checkbox"
                id="cs_active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#00a389' }}
              />
              <label htmlFor="cs_active" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Active
              </label>
            </div>

            <div className="sn-form-group full-width">
              <label className="sn-field-label">Description</label>
              <input
                type="text"
                className="sn-field-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this client script enforces..."
              />
            </div>
          </div>

          <div className="sn-form-group full-width">
            <label className="sn-field-label">
              Script (g_form sandbox)
            </label>
            <textarea
              className="sn-code-editor"
              rows={12}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>
              Tip: Save and open any {table} record to see this client script run live!
            </span>
            <button
              className="sn-btn sn-btn-default"
              onClick={() => openRecord('incident', 'inc_1001')}
            >
              Test on Sample Incident Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
