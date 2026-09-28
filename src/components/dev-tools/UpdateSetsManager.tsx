'use client';

import React, { useState } from 'react';
import { Layers, Plus, Download, CheckCircle2, FileCode, Check } from 'lucide-react';
import { usePlatform } from '@/lib/store';

export default function UpdateSetsManager() {
  const {
    updateSets,
    currentUpdateSet,
    setCurrentUpdateSet,
    createUpdateSet,
    completeUpdateSet,
  } = usePlatform();

  const [newSetName, setNewSetName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = () => {
    if (!newSetName.trim()) return;
    createUpdateSet(newSetName.trim());
    setNewSetName('');
    setShowCreateModal(false);
  };

  const handleExportXML = (usId: string) => {
    const us = updateSets.find((u) => u.sys_id === usId);
    if (!us) return;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="${new Date().toISOString()}">
  <sys_update_set action="INSERT_OR_UPDATE">
    <name>${us.name}</name>
    <application>${us.application}</application>
    <state>${us.state}</state>
    <sys_created_by>${us.created_by}</sys_created_by>
    <sys_created_on>${us.sys_created_on}</sys_created_on>
    <customer_updates>
${us.changes
  .map(
    (c) => `      <sys_update_xml action="INSERT_OR_UPDATE">
        <type>${c.type}</type>
        <target_name>${c.target_name}</target_name>
        <action>${c.action}</action>
        <recorded_at>${c.timestamp}</recorded_at>
      </sys_update_xml>`
  )
  .join('\n')}
    </customer_updates>
  </sys_update_set>
</unload>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `update_set_${us.name.replace(/\s+/g, '_')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px', background: 'var(--now-bg-surface)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--now-border)', paddingBottom: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Update Sets (sys_update_set)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            Captures configuration changes and developmental artifacts to export as XML for instance-to-instance migration.
          </p>
        </div>

        <button className="sn-btn sn-btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          <span>New Update Set</span>
        </button>
      </div>

      {/* Update Sets Table */}
      <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>State</th>
            <th>Application</th>
            <th>Changes Count</th>
            <th>Created By</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {updateSets.map((us) => {
            const isCurrent = currentUpdateSet?.sys_id === us.sys_id;
            return (
              <tr key={us.sys_id} style={{ background: isCurrent ? 'var(--now-green-light)' : undefined }}>
                <td style={{ fontWeight: 600, color: '#0369a1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{us.name}</span>
                    {isCurrent && (
                      <span style={{ fontSize: '10px', background: '#00a389', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: us.state === 'complete' ? '#dcfce7' : '#fef3c7',
                      color: us.state === 'complete' ? '#15803d' : '#b45309',
                    }}
                  >
                    {us.state}
                  </span>
                </td>
                <td>{us.application}</td>
                <td>{us.changes_count} customer updates</td>
                <td>{us.created_by}</td>
                <td>{us.sys_created_on}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isCurrent && us.state !== 'complete' && (
                      <button
                        className="sn-btn sn-btn-default"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => setCurrentUpdateSet(us)}
                      >
                        Make Current
                      </button>
                    )}
                    {us.state !== 'complete' && (
                      <button
                        className="sn-btn sn-btn-default"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => completeUpdateSet(us.sys_id)}
                      >
                        Complete
                      </button>
                    )}
                    <button
                      className="sn-btn sn-btn-default"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => handleExportXML(us.sys_id)}
                      title="Export Update Set to XML"
                    >
                      <Download size={12} />
                      <span>Export XML</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Customer Updates List in Current Update Set */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          Customer Updates in Current Set ({currentUpdateSet.name})
        </h2>
        {currentUpdateSet.changes.length === 0 ? (
          <div style={{ padding: '20px', background: 'var(--now-bg-surface-alt)', border: '1px solid var(--now-border)', borderRadius: '6px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
            No changes captured yet in this update set. Any client script, business rule, table, or flow you create will be tracked here automatically.
          </div>
        ) : (
          <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Target Name</th>
                <th>Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {currentUpdateSet.changes.map((c) => (
                <tr key={c.sys_id}>
                  <td style={{ fontWeight: 600 }}>{c.type}</td>
                  <td><code>{c.target_name}</code></td>
                  <td>{c.action}</td>
                  <td>{c.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="sn-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="sn-modal" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sn-modal-header">
              <span>Create New Update Set</span>
            </div>
            <div className="sn-modal-body">
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Name:
              </label>
              <input
                type="text"
                className="sn-field-input"
                placeholder="e.g. ITSM-2026-Incident-Enhancements"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="sn-modal-footer">
              <button className="sn-btn sn-btn-default" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="sn-btn sn-btn-primary" onClick={handleCreate}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
