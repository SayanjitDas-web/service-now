'use client';

import React, { useState } from 'react';
import { Plus, Clock, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Incident } from '@/lib/types';
import { usePlatform } from '@/lib/store';

interface RelatedListsProps {
  tableName: string;
  record: any;
}

export default function RelatedLists({ tableName, record }: RelatedListsProps) {
  const { cis } = usePlatform();
  const [activeTab, setActiveTab] = useState<'sla' | 'affected_cis' | 'tasks'>('sla');

  // Simulated SLAs for Incident
  const incidentSlas = [
    {
      id: 'sla_1',
      name: 'Priority 1 - Resolution (4 Hours)',
      target: 'Resolution',
      stage: record.state === '6' || record.state === '7' ? 'Achieved' : 'In progress',
      elapsedPercentage: record.priority === '1' ? 45 : 18,
      actualTime: '1h 22m',
      breachTime: '2026-09-25 12:00:00',
    },
    {
      id: 'sla_2',
      name: 'Priority 1 - Response (15 Mins)',
      target: 'Response',
      stage: 'Achieved',
      elapsedPercentage: 100,
      actualTime: '4m 12s',
      breachTime: '2026-09-25 08:15:00',
    },
  ];

  const affectedCi = cis.find((c) => c.sys_id === record.cmdb_ci);

  return (
    <div style={{ marginTop: '24px', borderTop: '2px solid var(--now-border)', background: 'var(--now-bg-surface)' }}>
      {/* Related List Tabs */}
      <div className="sn-form-tabs" style={{ background: 'var(--now-bg-surface-alt)', padding: '0 16px' }}>
        <div
          className={`sn-form-tab ${activeTab === 'sla' ? 'active' : ''}`}
          onClick={() => setActiveTab('sla')}
        >
          Task SLAs ({incidentSlas.length})
        </div>
        <div
          className={`sn-form-tab ${activeTab === 'affected_cis' ? 'active' : ''}`}
          onClick={() => setActiveTab('affected_cis')}
        >
          Affected CIs ({affectedCi ? 1 : 0})
        </div>
        <div
          className={`sn-form-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Incident Tasks (0)
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: TASK SLAS */}
        {activeTab === 'sla' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                Service Level Agreements (SLAs)
              </span>
            </div>

            <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
              <thead>
                <tr>
                  <th>SLA Definition</th>
                  <th>Target</th>
                  <th>Stage</th>
                  <th>Elapsed %</th>
                  <th>Actual Elapsed</th>
                  <th>Planned End Time (Breach)</th>
                </tr>
              </thead>
              <tbody>
                {incidentSlas.map((sla) => (
                  <tr key={sla.id}>
                    <td style={{ fontWeight: 600, color: '#0369a1' }}>{sla.name}</td>
                    <td>{sla.target}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          background: sla.stage === 'Achieved' ? '#dcfce7' : '#e0f2fe',
                          color: sla.stage === 'Achieved' ? '#15803d' : '#0369a1',
                        }}
                      >
                        {sla.stage}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '80px',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(sla.elapsedPercentage, 100)}%`,
                              height: '100%',
                              background: sla.elapsedPercentage > 80 ? '#dc2626' : '#00a389',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px' }}>{sla.elapsedPercentage}%</span>
                      </div>
                    </td>
                    <td>{sla.actualTime}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--now-text-muted)' }}>{sla.breachTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: AFFECTED CIS */}
        {activeTab === 'affected_cis' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                Configuration Items (CMDB)
              </span>
            </div>

            {affectedCi ? (
              <table className="sn-table" style={{ border: '1px solid var(--now-border)' }}>
                <thead>
                  <tr>
                    <th>CI Name</th>
                    <th>Class</th>
                    <th>Asset Tag</th>
                    <th>Operational Status</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#0369a1' }}>{affectedCi.name}</td>
                    <td>{affectedCi.class_name}</td>
                    <td>{affectedCi.asset_tag}</td>
                    <td>{affectedCi.status}</td>
                    <td>{affectedCi.ip_address || '—'}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No configuration items currently associated with this record.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TASKS */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                Incident Tasks (TASK)
              </span>
              <button
                className="sn-btn sn-btn-default"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => alert('New Incident Task created and assigned.')}
              >
                <Plus size={12} />
                <span>New Task</span>
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              No child tasks associated.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
