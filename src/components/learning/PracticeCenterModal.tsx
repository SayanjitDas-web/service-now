'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  X,
  Play,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';

interface PracticeCenterModalProps {
  onClose: () => void;
}

interface LabScenario {
  id: string;
  category: 'CSA (System Admin)' | 'CAD (Application Dev)' | 'ITSM Implementation';
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  steps: string[];
  hint: string;
  check: (state: any) => { passed: boolean; message: string };
}

export default function PracticeCenterModal({ onClose }: PracticeCenterModalProps) {
  const platform = usePlatform();

  const scenarios: LabScenario[] = [
    {
      id: 'lab_impersonate',
      category: 'CSA (System Admin)',
      title: 'Lab 1: Role-Based Access & User Impersonation',
      difficulty: 'Beginner',
      summary: 'Practice impersonating an ITIL technician to test view access without changing passwords.',
      steps: [
        'Click the User Impersonate icon in the top Polaris navigation bar.',
        'Select "Beth Anglin (beth.anglin)" or "David Loo (david.loo)".',
        'Observe the yellow warning banner confirming impersonation mode.',
      ],
      hint: 'The Impersonate icon is located in the top-right header (administrators only). Sign in as admin to use it.',
      check: (s) => {
        if (s.currentUser.sys_id !== s.actualUser.sys_id) {
          return { passed: true, message: `Successfully impersonating ${s.currentUser.name}!` };
        }
        return { passed: false, message: 'You are currently still logged in as System Administrator.' };
      },
    },
    {
      id: 'lab_triage_inc',
      category: 'ITSM Implementation',
      title: 'Lab 2: High Severity Incident Triage & Resolution',
      difficulty: 'Beginner',
      summary: 'Triage P1 Critical Incident INC0010002, assign it, move to In Progress, and save work notes.',
      steps: [
        'Open the Incidents list from the All menu.',
        'Double-click or click INC0010002 to open the form.',
        'Change State to "2 - In Progress".',
        'Set Assigned To or Assignment Group.',
        'Click Save or Update to commit changes.',
      ],
      hint: 'Look for INC0010002 in the Incident list. Ensure you click Save on the form header.',
      check: (s) => {
        const inc = s.incidents.find((i: any) => i.number === 'INC0010002');
        if (inc && inc.state === '2' && inc.assigned_to) {
          return { passed: true, message: 'INC0010002 is In Progress and assigned!' };
        }
        return {
          passed: false,
          message: 'INC0010002 is not yet In Progress with an assignee. Current state: ' + (inc?.state || 'Unknown'),
        };
      },
    },
    {
      id: 'lab_custom_table',
      category: 'CSA (System Admin)',
      title: 'Lab 3: Custom Application Table & Schema Architecture',
      difficulty: 'Intermediate',
      summary: 'Design a new custom table prefixed with "u_" using the Tables & Columns Data Dictionary.',
      steps: [
        'Open the All menu > System Definition > Tables & Columns (sys_db_object).',
        'Click "+ New Custom Table".',
        'Provide a Table Label (e.g. "Meeting Room Booking").',
        'Add at least 1 custom column and click "Create Table & Schema".',
      ],
      hint: 'Navigate to System Definition > Tables & Columns and use the "+ New Custom Table" button.',
      check: (s) => {
        const customCount = s.tables.filter((t: any) => t.is_custom).length;
        if (customCount > 1) {
          return { passed: true, message: `Verified! You created custom table schemas (Total custom: ${customCount})` };
        }
        return { passed: false, message: 'No new custom table created yet. Please create one in Tables & Columns.' };
      },
    },
    {
      id: 'lab_client_script',
      category: 'CAD (Application Dev)',
      title: 'Lab 4: Client Script (g_form) UI Policy Simulator',
      difficulty: 'Intermediate',
      summary: 'Create and activate a Client Script on the incident table enforcing field rules.',
      steps: [
        'Open All > System Definition > Client Scripts (sys_script_client).',
        'Click "+ New Client Script".',
        'Set Table to "Incident", Type to "onChange", Field to "State" or "Priority".',
        'Save the script and verify it executes when editing an incident.',
      ],
      hint: 'Ensure Active is checked and click "Save Script".',
      check: (s) => {
        if (s.clientScripts.length > 3) {
          return { passed: true, message: `Verified! Total active Client Scripts: ${s.clientScripts.length}` };
        }
        return { passed: false, message: 'Please create at least 1 new Client Script in the Client Scripts manager.' };
      },
    },
    {
      id: 'lab_catalog_order',
      category: 'ITSM Implementation',
      title: 'Lab 5: Service Catalog Request & RITM Fulfillment',
      difficulty: 'Beginner',
      summary: 'Request a developer workstation or cloud sandbox via the end-user Service Catalog.',
      steps: [
        'Navigate to Service Catalog Home from the All menu or top shortcuts.',
        'Choose an item (such as Standard Developer Workstation).',
        'Select memory/storage variables and click "Order Now".',
        'Verify generation of REQ and RITM numbers.',
      ],
      hint: 'Open Service Catalog, click "Request" on an item, fill variables, and click Order Now.',
      check: (s) => {
        if (s.serviceRequests.length > 1) {
          const latest = s.serviceRequests[s.serviceRequests.length - 1];
          return { passed: true, message: `Order verified! Latest Request: ${latest.number} (${latest.ritm_number})` };
        }
        return { passed: false, message: 'No new catalog order submitted yet.' };
      },
    },
  ];

  const [activeLabId, setActiveLabId] = useState(scenarios[0].id);
  const [labResults, setLabResults] = useState<Record<string, { passed: boolean; message: string }>>({});

  const activeScenario = scenarios.find((s) => s.id === activeLabId) || scenarios[0];

  const handleVerify = (lab: LabScenario) => {
    const result = lab.check(platform);
    setLabResults((prev) => ({
      ...prev,
      [lab.id]: result,
    }));
  };

  const completedCount = Object.values(labResults).filter((r) => r.passed).length;

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '840px', height: '82vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sn-modal-header" style={{ background: 'linear-gradient(135deg, #1b2e3c, #295e54)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#00a389', padding: '6px', borderRadius: '6px' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>ServiceNow Certification & Practice Labs</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Guided Hands-On Scenarios for CSA & CAD Exam Mastery
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
              Progress: <strong>{completedCount} / {scenarios.length}</strong> Completed
            </span>
            <button onClick={onClose} style={{ color: '#cbd5e1' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Split View: Left List, Right Scenario Detail */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Lab Menu */}
          <div
            style={{
              width: '320px',
              borderRight: '1px solid var(--now-border)',
              background: 'var(--now-bg-surface-alt)',
              overflowY: 'auto',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {scenarios.map((lab) => {
              const isSelected = lab.id === activeLabId;
              const result = labResults[lab.id];

              return (
                <div
                  key={lab.id}
                  onClick={() => setActiveLabId(lab.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1.5px solid #00a389' : '1px solid var(--now-border-light)',
                    background: isSelected ? '#ffffff' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#00a389', textTransform: 'uppercase' }}>
                      {lab.category}
                    </span>
                    {result?.passed ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                        <CheckCircle2 size={13} />
                        Done
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--now-text-muted)' }}>
                        {lab.difficulty}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--now-text-main)', lineHeight: 1.3 }}>
                    {lab.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Lab Detail */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#00a389', textTransform: 'uppercase' }}>
                  {activeScenario.category} • {activeScenario.difficulty}
                </span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--now-text-main)', marginBottom: '8px' }}>
                {activeScenario.title}
              </h2>

              <p style={{ fontSize: '13px', color: 'var(--now-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                {activeScenario.summary}
              </p>

              {/* Instructions Steps */}
              <div style={{ background: 'var(--now-bg-surface-alt)', border: '1px solid var(--now-border)', borderRadius: '8px', padding: '16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)', marginBottom: '10px' }}>
                  Step-by-Step Task Instructions:
                </div>
                <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  {activeScenario.steps.map((st, i) => (
                    <li key={i} style={{ color: 'var(--now-text-main)' }}>
                      {st}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Hint Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', fontSize: '12px', color: '#854d0e', marginBottom: '18px' }}>
                <HelpCircle size={16} />
                <span><strong>Exam Tip:</strong> {activeScenario.hint}</span>
              </div>

              {/* Live Verification Result Box */}
              {labResults[activeScenario.id] && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: labResults[activeScenario.id].passed ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${labResults[activeScenario.id].passed ? '#86efac' : '#fca5a5'}`,
                    color: labResults[activeScenario.id].passed ? '#15803d' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {labResults[activeScenario.id].passed ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{labResults[activeScenario.id].message}</span>
                </div>
              )}
            </div>

            {/* Verification Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--now-border)', paddingTop: '16px', marginTop: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--now-text-muted)' }}>
                You can switch back to the platform tabs anytime to execute changes.
              </span>
              <button
                className="sn-btn sn-btn-primary"
                style={{ padding: '8px 20px', fontWeight: 600 }}
                onClick={() => handleVerify(activeScenario)}
              >
                <CheckCircle2 size={15} />
                <span>Verify Task Completion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
