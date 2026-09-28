'use client';

import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { executeBackgroundScript, GlideRecordExecutionResult } from '@/lib/glideRecordSimulator';

const SAMPLE_SCRIPTS = [
  {
    name: 'Query Active P1 Incidents',
    code: `// 1. Initialize GlideRecord on 'incident' table
var gr = new GlideRecord('incident');
gr.addQuery('priority', '1');
gr.orderByDesc('sys_created_on');
gr.query();

gs.print('--- Found ' + gr.getRowCount() + ' P1 Critical Incidents ---');

// 2. Iterate through results
while (gr.next()) {
  gs.print('[' + gr.number + '] ' + gr.short_description);
  gs.print('   Caller: ' + gr.caller_id + ' | Created: ' + gr.sys_created_on);
}
gs.print('Query executed by: ' + gs.getUserName());`,
  },
  {
    name: 'Insert New Incident via GlideRecord',
    code: `// Insert a record programmatically using GlideRecord API
var gr = new GlideRecord('incident');
gr.initialize();
gr.short_description = 'Automated synthetic probe: Latency spike detected';
gr.category = 'Network';
gr.impact = '1';
gr.urgency = '2';
gr.priority = '2';
gr.work_notes = 'Created by Scheduled Script Execution background job.';

var sysId = gr.insert();
gs.print('Successfully inserted new record sys_id: ' + sysId);
gs.print('Current timestamp: ' + gs.nowDateTime());`,
  },
  {
    name: 'Bulk Update Priority 3 Incidents',
    code: `// Query incidents and update fields
var gr = new GlideRecord('incident');
gr.addQuery('state', '1'); // State New
gr.query();

var updatedCount = 0;
while (gr.next()) {
  gs.print('Triage incident: ' + gr.number + ' (current state: ' + gr.state + ')');
  // gr.setValue('state', '2'); // Move to In Progress
  // gr.update();
  updatedCount++;
}
gs.print('Total scanned: ' + updatedCount + ' incidents.');`,
  },
  {
    name: 'GlideSystem (gs) Diagnostics',
    code: `// Test platform GlideSystem utility methods
gs.print('User ID: ' + gs.getUserID());
gs.print('User Name: ' + gs.getUserName());
gs.print('Current Date/Time: ' + gs.nowDateTime());
gs.print('Beginning of Today: ' + gs.beginningOfToday());
gs.print('Is Admin: ' + gs.getUser().hasRole('admin'));

gs.log('Diagnostic probe completed successfully.');`,
  },
];

export default function ScriptBackground() {
  const { incidents, problems, changes, users, currentUser, setAllIncidents } = usePlatform();

  const [scriptCode, setScriptCode] = useState(SAMPLE_SCRIPTS[0].code);
  const [executionResult, setExecutionResult] = useState<GlideRecordExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunScript = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = executeBackgroundScript(scriptCode, {
        incidents,
        problems,
        changes,
        users,
        currentUser,
        updateIncidents: setAllIncidents,
      });
      setExecutionResult(res);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--now-bg-surface)', minHeight: '100%' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--now-border)', paddingBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={22} color="#00a389" />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Scripts - Background (sys.scripts.do)</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
            ServiceNow server-side execution sandbox. Practice GlideRecord queries, GlideSystem API commands, and bulk data manipulation.
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
            Load Practice Template:
          </span>
          <select
            className="sn-field-select"
            style={{ width: '240px' }}
            onChange={(e) => {
              const selected = SAMPLE_SCRIPTS.find((s) => s.name === e.target.value);
              if (selected) setScriptCode(selected.code);
            }}
          >
            {SAMPLE_SCRIPTS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
            JavaScript / GlideRecord Code:
          </span>
          <button
            className="sn-btn sn-btn-primary"
            style={{ padding: '6px 16px', fontWeight: 600 }}
            onClick={handleRunScript}
            disabled={isRunning}
          >
            <Play size={13} fill="white" />
            <span>{isRunning ? 'Executing...' : 'Run script'}</span>
          </button>
        </div>

        <textarea
          className="sn-code-editor"
          rows={14}
          value={scriptCode}
          onChange={(e) => setScriptCode(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Output Console (ServiceNow Style) */}
      {executionResult && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {executionResult.success ? (
                <CheckCircle2 size={16} color="#15803d" />
              ) : (
                <AlertCircle size={16} color="#dc2626" />
              )}
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                {executionResult.success
                  ? `Script execution completed in ${executionResult.executionTimeMs} ms`
                  : 'Script execution failed'}
              </span>
              {executionResult.recordsAffected > 0 && (
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {executionResult.recordsAffected} record(s) modified
                </span>
              )}
            </div>
            <button
              className="sn-btn sn-btn-default"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setExecutionResult(null)}
            >
              Clear Console
            </button>
          </div>

          <div className="sn-console-output">
            {executionResult.error ? (
              <div style={{ color: '#f87171' }}>
                Error: {executionResult.error}
              </div>
            ) : executionResult.output ? (
              executionResult.output
            ) : (
              <span style={{ color: '#94a3b8' }}>*** Script completed with no console print output ***</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
