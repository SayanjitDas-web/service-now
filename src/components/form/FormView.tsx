'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  ChevronLeft,
  Paperclip,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  Search,
  ExternalLink,
  GitPullRequest,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { Incident, TableDefinition, ColumnDefinition } from '@/lib/types';
import { createGForm, executeClientScript } from '@/lib/gFormSimulator';
import ReferenceFieldLookupModal from './ReferenceFieldLookupModal';
import ReferenceCardPreview from './ReferenceCardPreview';
import ActivityStream from './ActivityStream';
import RelatedLists from './RelatedLists';
import AttachmentUploadModal from '../shared/AttachmentUploadModal';

interface FormViewProps {
  tableName: string;
  sysId: string;
}

export default function FormView({ tableName, sysId }: FormViewProps) {
  const {
    incidents,
    problems,
    changes,
    cis,
    users,
    groups,
    tables,
    clientScripts,
    saveIncident,
    deleteIncident,
    deleteRecord,
    saveProblem,
    saveChange,
    saveCustomRecord,
    customRecords,
    openList,
    openRecord,
    currentUser,
    attachments,
  } = usePlatform();

  const isNew = sysId === 'new';

  // Load record data
  const originalRecord = useMemo(() => {
    if (isNew) {
      if (tableName === 'incident') {
        return {
          sys_id: 'new',
          number: 'INC(Auto)',
          short_description: '',
          description: '',
          state: '1',
          caller_id: currentUser.sys_id,
          category: 'Software',
          impact: '3',
          urgency: '3',
          priority: '4',
          assignment_group: 'grp_servicedesk',
          assigned_to: '',
          cmdb_ci: '',
          work_notes: '',
          comments: '',
          close_notes: '',
        };
      }
      return { sys_id: 'new' };
    }

    if (tableName === 'incident') return incidents.find((i) => i.sys_id === sysId);
    if (tableName === 'problem') return problems.find((p) => p.sys_id === sysId);
    if (tableName === 'change_request') return changes.find((c) => c.sys_id === sysId);
    if (customRecords[tableName]) return customRecords[tableName].find((r) => r.sys_id === sysId);
    return null;
  }, [tableName, sysId, isNew, incidents, problems, changes, customRecords, currentUser]);

  const [formData, setFormData] = useState<Record<string, any>>(originalRecord || {});
  const [formSectionTab, setFormSectionTab] = useState<'notes' | 'related' | 'resolution'>('notes');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState<{ field: string; refTable: string } | null>(null);
  const [previewCard, setPreviewCard] = useState<{ field: string; refTable: string; sysId: string } | null>(null);
  const [infoMessages, setInfoMessages] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [mandatoryFields, setMandatoryFields] = useState<Record<string, boolean>>({
    short_description: true,
    caller_id: tableName === 'incident',
  });

  const currentTableDef = tables.find((t) => t.name === tableName);
  const tableLabel = currentTableDef?.label || tableName;

  // Execute onLoad Client Scripts
  useEffect(() => {
    const scripts = clientScripts.filter(
      (s) => s.table === tableName && s.type === 'onLoad' && s.active
    );
    if (scripts.length === 0) return;

    const schemaRules: any = {
      short_description: { mandatory: true },
      caller_id: { mandatory: tableName === 'incident' },
    };

    const sandbox = createGForm(formData, schemaRules, currentUser);

    scripts.forEach((s) => {
      executeClientScript('onLoad', s.script, sandbox.g_form, sandbox.g_user);
    });

    if (sandbox.infoMessages.length > 0) {
      setTimeout(() => setInfoMessages((prev) => [...prev, ...sandbox.infoMessages]), 0);
    }
    if (sandbox.errorMessages.length > 0) {
      setTimeout(() => setErrorMessages((prev) => [...prev, ...sandbox.errorMessages]), 0);
    }
  }, [tableName]);

  // Handle Field Change and trigger onChange Client Scripts
  const handleFieldChange = (fieldName: string, newValue: any) => {
    const oldValue = formData[fieldName];
    const updated = { ...formData, [fieldName]: newValue };
    setFormData(updated);

    // Run active onChange Client Scripts for this field
    const scripts = clientScripts.filter(
      (s) => s.table === tableName && s.type === 'onChange' && s.field_name === fieldName && s.active
    );

    if (scripts.length > 0) {
      const sandbox = createGForm(updated, { [fieldName]: { mandatory: mandatoryFields[fieldName] } }, currentUser, (updates) => {
        for (const [k, v] of Object.entries(updates)) {
          if (v && v.mandatory !== undefined) {
            setMandatoryFields((m) => ({ ...m, [k]: v.mandatory }));
          }
        }
      });

      scripts.forEach((s) => {
        executeClientScript('onChange', s.script, sandbox.g_form, sandbox.g_user, {
          control: fieldName,
          oldValue,
          newValue,
          isLoading: false,
        });
      });

      setInfoMessages(sandbox.infoMessages);
      setErrorMessages(sandbox.errorMessages);
    }
  };

  // Save Record
  const handleSave = (andClose: boolean = false) => {
    // Validate mandatory fields
    const missing: string[] = [];
    if (currentTableDef?.is_custom) {
      currentTableDef.columns.forEach((col) => {
        if ((col.mandatory || mandatoryFields[col.name]) && !formData[col.name]) {
          missing.push(col.label);
        }
      });
    } else {
      if (mandatoryFields.short_description && !formData.short_description?.trim()) {
        missing.push('Short description');
      }
      if (tableName === 'incident' && mandatoryFields.caller_id && !formData.caller_id) {
        missing.push('Caller');
      }
      if (mandatoryFields.close_notes && !formData.close_notes?.trim()) {
        missing.push('Resolution notes');
      }
    }

    if (missing.length > 0) {
      setErrorMessages([`The following mandatory fields are not filled in: ${missing.join(', ')}`]);
      return;
    }

    let savedRec: any;
    if (tableName === 'incident') {
      savedRec = saveIncident(formData);
    } else if (tableName === 'problem') {
      savedRec = saveProblem(formData);
    } else if (tableName === 'change_request') {
      savedRec = saveChange(formData);
    } else {
      savedRec = saveCustomRecord(tableName, formData);
    }

    setFormData(savedRec);
    setErrorMessages([]);
    setInfoMessages(['Record saved successfully.']);

    if (andClose) {
      openList(tableName);
    }
  };

  // Actions
  const handleResolveIncident = () => {
    if (!formData.close_notes?.trim()) {
      setErrorMessages(['Resolution notes are mandatory when resolving an incident.']);
      setFormSectionTab('resolution');
      return;
    }
    const resolved = saveIncident({
      ...formData,
      state: '6', // Resolved
      close_code: formData.close_code || 'Solved (Permanently)',
    });
    setFormData(resolved);
    setInfoMessages(['Incident marked as Resolved.']);
  };

  const handleCloseIncident = () => {
    const closed = saveIncident({
      ...formData,
      state: '7', // Closed
    });
    setFormData(closed);
    setInfoMessages(['Incident closed.']);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete record ${formData.number || formData.sys_id}?`)) {
      deleteRecord(tableName, formData.sys_id);
      openList(tableName);
    }
  };

  const handleCreateProblem = () => {
    const prb = saveProblem({
      short_description: `Investigate root cause: ${formData.short_description}`,
      description: formData.description,
      priority: formData.priority,
    });
    saveIncident({ ...formData, problem_id: prb.number });
    openRecord('problem', prb.sys_id);
  };

  const recordAttachments = attachments.filter(
    (a) => a.table_name === tableName && a.table_sys_id === formData.sys_id
  );

  const callerUser = users.find((u) => u.sys_id === formData.caller_id);
  const assignedUser = users.find((u) => u.sys_id === formData.assigned_to);
  const assignedGroup = groups.find((g) => g.sys_id === formData.assignment_group);
  const assignedCi = cis.find((c) => c.sys_id === formData.cmdb_ci);

  return (
    <div className="sn-form-container">
      {/* Form Header */}
      <div className="sn-form-header">
        <div className="sn-form-title-left">
          {/* Hamburger Context Menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="sn-header-icon-btn"
              onClick={() => setShowContextMenu(!showContextMenu)}
              title="Form Context Menu"
            >
              <Menu size={16} />
            </button>

            {showContextMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  width: '220px',
                  background: 'var(--now-bg-surface)',
                  border: '1px solid var(--now-border)',
                  borderRadius: '4px',
                  boxShadow: 'var(--now-shadow-dropdown)',
                  zIndex: 200,
                  padding: '6px 0',
                }}
              >
                <div
                  className="sn-nav-item"
                  onClick={() => {
                    handleSave(false);
                    setShowContextMenu(false);
                  }}
                >
                  Save (Keep on Form)
                </div>
                <div
                  className="sn-nav-item"
                  onClick={() => {
                    handleSave(true);
                    setShowContextMenu(false);
                  }}
                >
                  Insert and Return
                </div>
                <div
                  className="sn-nav-item"
                  onClick={() => {
                    navigator.clipboard.writeText(formData.sys_id);
                    alert('Copied sys_id: ' + formData.sys_id);
                    setShowContextMenu(false);
                  }}
                >
                  Copy sys_id
                </div>
                <div style={{ borderTop: '1px solid var(--now-border-light)', margin: '4px 0' }} />
                <div
                  className="sn-nav-item"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload Form
                </div>
              </div>
            )}
          </div>

          {/* Back button */}
          <button
            className="sn-header-icon-btn"
            onClick={() => openList(tableName)}
            title={`Back to ${tableLabel} list`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Record Number Title & State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sn-form-number-title">
              {formData.number || `${tableLabel} - ${formData.sys_id}`}
            </span>
            {formData.short_description && (
              <span style={{ fontSize: '13px', color: 'var(--now-text-muted)' }}>
                — {formData.short_description.substring(0, 40)}
                {formData.short_description.length > 40 ? '...' : ''}
              </span>
            )}
            {formData.priority && (
              <span className={`sn-badge sn-badge-p${formData.priority}`}>
                P{formData.priority}
              </span>
            )}
          </div>
        </div>

        {/* Right UI Actions Group */}
        <div className="sn-ui-actions-group">
          {/* Attachments Icon */}
          <button
            className="sn-btn sn-btn-default"
            style={{ position: 'relative' }}
            onClick={() => setShowAttachmentModal(true)}
            title="Manage Attachments (ImageKit Media Engine)"
          >
            <Paperclip size={13} />
            <span>Manage Attachments</span>
            {recordAttachments.length > 0 && (
              <span
                style={{
                  background: '#00a389',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: '4px',
                }}
              >
                {recordAttachments.length}
              </span>
            )}
          </button>

          {tableName === 'incident' && formData.state !== '6' && formData.state !== '7' && (
            <button
              className="sn-btn sn-btn-default"
              style={{ color: '#15803d', borderColor: '#86efac' }}
              onClick={handleResolveIncident}
              title="Resolve Incident"
            >
              <Check size={13} />
              <span>Resolve</span>
            </button>
          )}

          {tableName === 'incident' && formData.state === '6' && (
            <button
              className="sn-btn sn-btn-default"
              onClick={handleCloseIncident}
              title="Close Incident"
            >
              Close Incident
            </button>
          )}

          {tableName === 'incident' && !formData.problem_id && !isNew && (
            <button
              className="sn-btn sn-btn-default"
              onClick={handleCreateProblem}
              title="Create Problem from Incident"
            >
              <FileText size={13} />
              <span>Create Problem</span>
            </button>
          )}

          {!isNew && (
            <button
              className="sn-btn sn-btn-default"
              style={{ color: '#dc2626' }}
              onClick={handleDelete}
              title="Delete Record"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            className="sn-btn sn-btn-default"
            onClick={() => handleSave(false)}
            title="Save changes and stay on form"
          >
            <Save size={13} />
            <span>Save</span>
          </button>

          <button
            className="sn-btn sn-btn-primary"
            onClick={() => handleSave(true)}
            title="Save changes and return to list view"
          >
            <span>{isNew ? 'Submit' : 'Update'}</span>
          </button>
        </div>
      </div>

      {/* Info & Error Banner Alerts (ServiceNow style) */}
      {infoMessages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '8px 16px',
            fontSize: '12.5px',
            borderBottom: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Info size={15} />
          <span>{msg}</span>
        </div>
      ))}

      {errorMessages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '8px 16px',
            fontSize: '12.5px',
            borderBottom: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} />
          <span>{msg}</span>
        </div>
      ))}

      {/* Main Form Fields Grid */}
      <div className="sn-form-body">
        {currentTableDef?.is_custom ? (
          <div className="sn-form-grid">
            <div className="sn-form-group">
              <label className="sn-field-label">Sys ID</label>
              <input
                type="text"
                className="sn-field-input read-only"
                value={formData.sys_id || '(Auto-generated)'}
                readOnly
              />
            </div>
            {currentTableDef.columns.map((col) => {
              if (col.name === 'sys_id') return null;
              return (
                <div
                  key={col.name}
                  className={`sn-form-group ${col.type === 'journal' ? 'full-width' : ''}`}
                >
                  <label className="sn-field-label">
                    {col.mandatory && <span className="sn-mandatory-asterisk">*</span>}
                    {col.label}
                  </label>
                  {col.type === 'choice' ? (
                    <select
                      className="sn-field-select"
                      value={formData[col.name] ?? col.default_value ?? ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                    >
                      <option value="">-- None --</option>
                      {col.choices?.map((ch) => (
                        <option key={ch.value} value={ch.value}>
                          {ch.label}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'boolean' ? (
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <input
                        type="checkbox"
                        checked={!!formData[col.name]}
                        onChange={(e) => handleFieldChange(col.name, e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>
                  ) : col.type === 'journal' ? (
                    <textarea
                      className="sn-field-textarea"
                      rows={3}
                      value={formData[col.name] || ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                    />
                  ) : col.type === 'integer' ? (
                    <input
                      type="number"
                      className="sn-field-input"
                      value={formData[col.name] ?? ''}
                      onChange={(e) => handleFieldChange(col.name, Number(e.target.value))}
                    />
                  ) : (
                    <input
                      type="text"
                      className="sn-field-input"
                      value={formData[col.name] ?? ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sn-form-grid">
            {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Number */}
            <div className="sn-form-group">
              <label className="sn-field-label">Number</label>
              <input
                type="text"
                className="sn-field-input read-only"
                value={formData.number || '(Auto-generated)'}
                readOnly
              />
            </div>

            {/* Caller */}
            <div className="sn-form-group">
              <label className="sn-field-label">
                {mandatoryFields.caller_id && <span className="sn-mandatory-asterisk">*</span>}
                Caller
              </label>
              <div className="sn-ref-field-wrapper">
                <input
                  type="text"
                  className="sn-field-input sn-ref-input"
                  placeholder="Select caller..."
                  value={callerUser ? `${callerUser.name} (${callerUser.user_name})` : ''}
                  readOnly
                  onClick={() => setShowLookupModal({ field: 'caller_id', refTable: 'sys_user' })}
                />
                <button
                  type="button"
                  className="sn-ref-btn"
                  onClick={() => setShowLookupModal({ field: 'caller_id', refTable: 'sys_user' })}
                  title="Lookup Caller"
                >
                  <Search size={14} />
                </button>
                {callerUser && (
                  <button
                    type="button"
                    className="sn-ref-info-btn"
                    onClick={() =>
                      setPreviewCard(
                        previewCard?.field === 'caller_id'
                          ? null
                          : { field: 'caller_id', refTable: 'sys_user', sysId: callerUser.sys_id }
                      )
                    }
                    title="Preview Caller Information"
                  >
                    <Info size={14} />
                  </button>
                )}
                {previewCard?.field === 'caller_id' && (
                  <ReferenceCardPreview
                    referenceTable="sys_user"
                    sysId={callerUser?.sys_id || ''}
                    onClose={() => setPreviewCard(null)}
                  />
                )}
              </div>
            </div>

            {/* Category */}
            <div className="sn-form-group">
              <label className="sn-field-label">Category</label>
              <select
                className="sn-field-select"
                value={formData.category || 'Software'}
                onChange={(e) => handleFieldChange('category', e.target.value)}
              >
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Network">Network</option>
                <option value="Database">Database</option>
                <option value="Inquiry">Inquiry / Help</option>
              </select>
            </div>

            {/* Subcategory */}
            <div className="sn-form-group">
              <label className="sn-field-label">Subcategory</label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="e.g. Email & Messaging"
                value={formData.subcategory || ''}
                onChange={(e) => handleFieldChange('subcategory', e.target.value)}
              />
            </div>

            {/* Configuration Item */}
            <div className="sn-form-group">
              <label className="sn-field-label">Configuration item</label>
              <div className="sn-ref-field-wrapper">
                <input
                  type="text"
                  className="sn-field-input sn-ref-input"
                  placeholder="Select CMDB CI..."
                  value={assignedCi ? `${assignedCi.name} (${assignedCi.asset_tag})` : ''}
                  readOnly
                  onClick={() => setShowLookupModal({ field: 'cmdb_ci', refTable: 'cmdb_ci' })}
                />
                <button
                  type="button"
                  className="sn-ref-btn"
                  onClick={() => setShowLookupModal({ field: 'cmdb_ci', refTable: 'cmdb_ci' })}
                  title="Lookup Configuration Item"
                >
                  <Search size={14} />
                </button>
                {assignedCi && (
                  <button
                    type="button"
                    className="sn-ref-info-btn"
                    onClick={() =>
                      setPreviewCard(
                        previewCard?.field === 'cmdb_ci'
                          ? null
                          : { field: 'cmdb_ci', refTable: 'cmdb_ci', sysId: assignedCi.sys_id }
                      )
                    }
                    title="Preview CI Details"
                  >
                    <Info size={14} />
                  </button>
                )}
                {previewCard?.field === 'cmdb_ci' && (
                  <ReferenceCardPreview
                    referenceTable="cmdb_ci"
                    sysId={assignedCi?.sys_id || ''}
                    onClose={() => setPreviewCard(null)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* State */}
            <div className="sn-form-group">
              <label className="sn-field-label">State</label>
              <select
                className="sn-field-select"
                value={formData.state || '1'}
                onChange={(e) => handleFieldChange('state', e.target.value)}
              >
                <option value="1">1 - New</option>
                <option value="2">2 - In Progress</option>
                <option value="3">3 - On Hold</option>
                <option value="6">6 - Resolved</option>
                <option value="7">7 - Closed</option>
                <option value="8">8 - Canceled</option>
              </select>
            </div>

            {/* Impact */}
            <div className="sn-form-group">
              <label className="sn-field-label">Impact</label>
              <select
                className="sn-field-select"
                value={formData.impact || '3'}
                onChange={(e) => handleFieldChange('impact', e.target.value)}
              >
                <option value="1">1 - High</option>
                <option value="2">2 - Medium</option>
                <option value="3">3 - Low</option>
              </select>
            </div>

            {/* Urgency */}
            <div className="sn-form-group">
              <label className="sn-field-label">Urgency</label>
              <select
                className="sn-field-select"
                value={formData.urgency || '3'}
                onChange={(e) => handleFieldChange('urgency', e.target.value)}
              >
                <option value="1">1 - High</option>
                <option value="2">2 - Medium</option>
                <option value="3">3 - Low</option>
              </select>
            </div>

            {/* Priority (Calculated by Business Rule) */}
            <div className="sn-form-group">
              <label className="sn-field-label">Priority (Calculated)</label>
              <input
                type="text"
                className="sn-field-input read-only"
                value={
                  formData.priority === '1'
                    ? '1 - Critical'
                    : formData.priority === '2'
                    ? '2 - High'
                    : formData.priority === '3'
                    ? '3 - Moderate'
                    : '4 - Low'
                }
                readOnly
              />
            </div>

            {/* Assignment Group */}
            <div className="sn-form-group">
              <label className="sn-field-label">Assignment group</label>
              <div className="sn-ref-field-wrapper">
                <input
                  type="text"
                  className="sn-field-input sn-ref-input"
                  placeholder="Select group..."
                  value={assignedGroup ? assignedGroup.name : ''}
                  readOnly
                  onClick={() => setShowLookupModal({ field: 'assignment_group', refTable: 'sys_user_group' })}
                />
                <button
                  type="button"
                  className="sn-ref-btn"
                  onClick={() => setShowLookupModal({ field: 'assignment_group', refTable: 'sys_user_group' })}
                  title="Lookup Assignment Group"
                >
                  <Search size={14} />
                </button>
              </div>
            </div>

            {/* Assigned To */}
            <div className="sn-form-group">
              <label className="sn-field-label">Assigned to</label>
              <div className="sn-ref-field-wrapper">
                <input
                  type="text"
                  className="sn-field-input sn-ref-input"
                  placeholder="Assign fulfiller..."
                  value={assignedUser ? `${assignedUser.name} (${assignedUser.user_name})` : ''}
                  readOnly
                  onClick={() => setShowLookupModal({ field: 'assigned_to', refTable: 'sys_user' })}
                />
                <button
                  type="button"
                  className="sn-ref-btn"
                  onClick={() => setShowLookupModal({ field: 'assigned_to', refTable: 'sys_user' })}
                  title="Lookup Assignee"
                >
                  <Search size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Full Width: Short Description */}
          <div className="sn-form-group full-width">
            <label className="sn-field-label">
              {mandatoryFields.short_description && <span className="sn-mandatory-asterisk">*</span>}
              Short description
            </label>
            <input
              type="text"
              className="sn-field-input"
              placeholder="Brief summary of the issue..."
              value={formData.short_description || ''}
              onChange={(e) => handleFieldChange('short_description', e.target.value)}
            />
          </div>

          {/* Full Width: Description */}
          <div className="sn-form-group full-width">
            <label className="sn-field-label">Description</label>
            <textarea
              className="sn-field-textarea"
              rows={3}
              placeholder="Detailed description, symptoms, repro steps..."
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
          </div>
        </div>
        )}

        {/* Form Sections Tabs: Notes, Related Records, Resolution Information */}
        <div className="sn-form-tabs">
          <div
            className={`sn-form-tab ${formSectionTab === 'notes' ? 'active' : ''}`}
            onClick={() => setFormSectionTab('notes')}
          >
            Notes & Activity Stream
          </div>
          <div
            className={`sn-form-tab ${formSectionTab === 'related' ? 'active' : ''}`}
            onClick={() => setFormSectionTab('related')}
          >
            Related Records
          </div>
          <div
            className={`sn-form-tab ${formSectionTab === 'resolution' ? 'active' : ''}`}
            onClick={() => setFormSectionTab('resolution')}
          >
            Resolution Information
          </div>
        </div>

        {/* Tab 1: Notes & Activity Stream */}
        {formSectionTab === 'notes' && (
          <ActivityStream tableName={tableName} recordId={formData.sys_id} />
        )}

        {/* Tab 2: Related Records */}
        {formSectionTab === 'related' && (
          <div className="sn-form-grid" style={{ marginTop: '12px' }}>
            <div className="sn-form-group">
              <label className="sn-field-label">Problem</label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="PRB number..."
                value={formData.problem_id || ''}
                onChange={(e) => handleFieldChange('problem_id', e.target.value)}
              />
            </div>
            <div className="sn-form-group">
              <label className="sn-field-label">Change Request</label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="CHG number..."
                value={formData.change_request_id || ''}
                onChange={(e) => handleFieldChange('change_request_id', e.target.value)}
              />
            </div>
            <div className="sn-form-group">
              <label className="sn-field-label">Parent Incident</label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="Parent INC..."
                value={formData.parent_incident || ''}
                onChange={(e) => handleFieldChange('parent_incident', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Resolution Information */}
        {formSectionTab === 'resolution' && (
          <div className="sn-form-grid" style={{ marginTop: '12px' }}>
            <div className="sn-form-group">
              <label className="sn-field-label">Resolution Code</label>
              <select
                className="sn-field-select"
                value={formData.close_code || 'Solved (Permanently)'}
                onChange={(e) => handleFieldChange('close_code', e.target.value)}
              >
                <option value="Solved (Work Around)">Solved (Work Around)</option>
                <option value="Solved (Permanently)">Solved (Permanently)</option>
                <option value="Closed/Resolved by Caller">Closed/Resolved by Caller</option>
                <option value="Not Solved">Not Solved (Not Reproducible)</option>
              </select>
            </div>

            <div className="sn-form-group">
              <label className="sn-field-label">Resolved At</label>
              <input
                type="text"
                className="sn-field-input read-only"
                value={formData.resolved_at || 'Not yet resolved'}
                readOnly
              />
            </div>

            <div className="sn-form-group full-width">
              <label className="sn-field-label">
                {mandatoryFields.close_notes && <span className="sn-mandatory-asterisk">*</span>}
                Resolution notes
              </label>
              <textarea
                className="sn-field-textarea"
                rows={3}
                placeholder="Document the resolution steps, root cause fix, or workaround applied..."
                value={formData.close_notes || ''}
                onChange={(e) => handleFieldChange('close_notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Related Lists at the bottom */}
        {!isNew && <RelatedLists tableName={tableName} record={formData} />}
      </div>

      {/* Reference Lookup Modal */}
      {showLookupModal && (
        <ReferenceFieldLookupModal
          referenceTable={showLookupModal.refTable}
          onSelect={(id) => {
            handleFieldChange(showLookupModal.field, id);
            setShowLookupModal(null);
          }}
          onClose={() => setShowLookupModal(null)}
        />
      )}

      {/* Attachment Upload Modal */}
      {showAttachmentModal && (
        <AttachmentUploadModal
          tableName={tableName}
          recordId={formData.sys_id}
          onClose={() => setShowAttachmentModal(false)}
        />
      )}
    </div>
  );
}
