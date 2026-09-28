'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Mail,
  CheckSquare,
  FileEdit,
  Terminal,
  ChevronRight,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { FlowDefinition, FlowAction } from '@/lib/types';

export default function FlowDesigner() {
  const { flows, saveFlow, incidents } = usePlatform();

  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const currentFlow = flows[activeFlowIndex] || flows[0];

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedIncidentForTest, setSelectedIncidentForTest] = useState(incidents[0]?.sys_id || '');
  const [testExecutionResult, setTestExecutionResult] = useState<string[] | null>(null);

  const handleTestFlow = () => {
    const inc = incidents.find((i) => i.sys_id === selectedIncidentForTest);
    const logs: string[] = [
      `[${new Date().toISOString()}] Flow Engine initialized: ${currentFlow.name}`,
      `Trigger Evaluated: Table [${currentFlow.trigger_table}] with condition [${currentFlow.trigger_condition}]`,
      `Context: Record ${inc?.number || 'INC0010001'} (Priority ${inc?.priority || '1'}, State ${inc?.state || 'New'})`,
    ];

    currentFlow.actions.forEach((action, idx) => {
      if (action.type === 'send_email') {
        logs.push(`Step ${idx + 1} [Send Email]: Dispatched notification to ${action.config.recipient || 'admin@corp.com'}`);
      } else if (action.type === 'create_task') {
        logs.push(`Step ${idx + 1} [Create Task]: Created and linked subtask assigned to ${action.config.assignment_group || 'Service Desk'}`);
      } else if (action.type === 'ask_approval') {
        logs.push(`Step ${idx + 1} [Ask for Approval]: Requested approval from manager persona`);
      } else if (action.type === 'update_record') {
        logs.push(`Step ${idx + 1} [Update Record]: Updated field values on ${inc?.number}`);
      } else {
        logs.push(`Step ${idx + 1} [Log Message]: ${action.config.message || 'Flow step completed'}`);
      }
    });

    logs.push(`[${new Date().toISOString()}] Flow execution state: SUCCESS (Execution time: 42ms)`);
    setTestExecutionResult(logs);
  };

  const getActionIcon = (type: FlowAction['type']) => {
    switch (type) {
      case 'send_email':
        return <Mail size={16} color="#0284c7" />;
      case 'create_task':
        return <CheckSquare size={16} color="#00a389" />;
      case 'ask_approval':
        return <CheckCircle2 size={16} color="#8b5cf6" />;
      case 'update_record':
        return <FileEdit size={16} color="#f59e0b" />;
      default:
        return <Terminal size={16} color="#64748b" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--now-bg-body)' }}>
      {/* Flow Designer Header */}
      <div
        style={{
          height: '52px',
          background: 'var(--now-bg-surface)',
          borderBottom: '1px solid var(--now-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Workflow size={20} color="#00a389" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Flow Designer</span>
          <span style={{ color: 'var(--now-text-muted)' }}>|</span>
          <select
            className="sn-field-select"
            style={{ fontWeight: 600, width: '280px' }}
            value={activeFlowIndex}
            onChange={(e) => setActiveFlowIndex(parseInt(e.target.value))}
          >
            {flows.map((f, i) => (
              <option key={f.sys_id} value={i}>
                {f.name} ({f.active ? 'Published' : 'Draft'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="sn-btn sn-btn-default"
            onClick={() => {
              setTestModalOpen(true);
              setTestExecutionResult(null);
            }}
          >
            <Play size={13} fill="#00a389" color="#00a389" />
            <span>Test Flow</span>
          </button>
          <button className="sn-btn sn-btn-primary">
            <CheckCircle2 size={14} />
            <span>Activate</span>
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Trigger Node Card */}
        <div
          style={{
            width: '600px',
            background: 'var(--now-bg-surface)',
            border: '2px solid #00a389',
            borderRadius: '8px',
            boxShadow: 'var(--now-shadow-md)',
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#e6f7f4', padding: '10px 16px', borderBottom: '1px solid #7fd3c2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '12px', color: '#006d5b', textTransform: 'uppercase' }}>
              TRIGGER • Record Created or Updated
            </span>
            <span style={{ fontSize: '11px', background: '#ffffff', color: '#006d5b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Live
            </span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px' }}>
              <strong>Table:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>{currentFlow.trigger_table}</code>
            </div>
            <div style={{ fontSize: '13px' }}>
              <strong>Condition:</strong> <span style={{ color: '#0369a1', fontWeight: 600 }}>{currentFlow.trigger_condition}</span>
            </div>
          </div>
        </div>

        {/* Action Steps Flow Sequence */}
        {currentFlow.actions.map((action, idx) => (
          <React.Fragment key={action.id}>
            {/* Connecting Vertical Arrow */}
            <div style={{ width: '2px', height: '28px', background: '#cbd5e1' }} />

            {/* Action Card */}
            <div
              style={{
                width: '600px',
                background: 'var(--now-bg-surface)',
                border: '1px solid var(--now-border)',
                borderRadius: '8px',
                boxShadow: 'var(--now-shadow-sm)',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ padding: '10px 16px', background: 'var(--now-bg-surface-alt)', borderBottom: '1px solid var(--now-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                    {idx + 1}
                  </span>
                  {getActionIcon(action.type)}
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{action.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>
                  Action
                </span>
              </div>
              <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--now-text-secondary)' }}>
                {Object.entries(action.config).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600 }}>{k}:</span> {String(v)}
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}

        {/* Add Step Card */}
        <div style={{ width: '2px', height: '28px', background: '#cbd5e1' }} />
        <button
          className="sn-btn sn-btn-default"
          style={{ width: '600px', padding: '10px', justifyContent: 'center', borderStyle: 'dashed', borderRadius: '8px' }}
          onClick={() => alert('New action step added to flow canvas.')}
        >
          <Plus size={14} />
          <span>Add an Action, Flow Logic, or Subflow</span>
        </button>
      </div>

      {/* Test Flow Modal */}
      {testModalOpen && (
        <div className="sn-modal-backdrop" onClick={() => setTestModalOpen(false)}>
          <div className="sn-modal" style={{ width: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sn-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} color="#00a389" />
                <span>Test Flow — {currentFlow.name}</span>
              </div>
              <button onClick={() => setTestModalOpen(false)} style={{ color: '#94a3b8' }}>
                <X size={17} />
              </button>
            </div>

            <div className="sn-modal-body">
              <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginBottom: '12px' }}>
                Select a record from <strong>{currentFlow.trigger_table}</strong> to simulate trigger conditions and step through flow execution.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Record to test with:
                </label>
                <select
                  className="sn-field-select"
                  value={selectedIncidentForTest}
                  onChange={(e) => setSelectedIncidentForTest(e.target.value)}
                >
                  {incidents.map((i) => (
                    <option key={i.sys_id} value={i.sys_id}>
                      {i.number} — {i.short_description} (P{i.priority})
                    </option>
                  ))}
                </select>
              </div>

              <button className="sn-btn sn-btn-primary" onClick={handleTestFlow}>
                Run Flow Test
              </button>

              {testExecutionResult && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
                    Execution Details Log
                  </span>
                  <div className="sn-console-output" style={{ marginTop: '6px' }}>
                    {testExecutionResult.join('\n')}
                  </div>
                </div>
              )}
            </div>

            <div className="sn-modal-footer">
              <button className="sn-btn sn-btn-default" onClick={() => setTestModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
