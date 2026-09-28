'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Image,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  X,
  Palette,
  Eye,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { getSupabaseConfig, resetSupabaseClient, SUPABASE_SQL_SCHEMA } from '@/lib/supabaseClient';
import { getImageKitConfig } from '@/lib/imagekitClient';

interface InstanceSettingsModalProps {
  onClose: () => void;
}

export default function InstanceSettingsModal({ onClose }: InstanceSettingsModalProps) {
  const {
    theme,
    setTheme,
    compactDensity,
    setCompactDensity,
    resetToDefaultData,
  } = usePlatform();

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseSaved, setSupabaseSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // ImageKit states
  const [imagekitUrl, setImagekitUrl] = useState('');
  const [imagekitPublicKey, setImagekitPublicKey] = useState('');
  const [imagekitSaved, setImagekitSaved] = useState(false);

  // Active sub-tab
  const [settingsTab, setSettingsTab] = useState<'integrations' | 'appearance' | 'database'>('integrations');

  useEffect(() => {
    const supa = getSupabaseConfig();
    if (supa.url) setSupabaseUrl(supa.url);
    if (supa.anonKey) setSupabaseKey(supa.anonKey);

    const ik = getImageKitConfig();
    if (ik.urlEndpoint) setImagekitUrl(ik.urlEndpoint);
    if (ik.publicKey) setImagekitPublicKey(ik.publicKey);
  }, []);

  const handleSaveSupabase = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sn_supabase_url', supabaseUrl.trim());
      localStorage.setItem('sn_supabase_anon_key', supabaseKey.trim());
      resetSupabaseClient();
      setSupabaseSaved(true);
      setTimeout(() => setSupabaseSaved(false), 3000);
    }
  };

  const handleSaveImageKit = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sn_imagekit_url_endpoint', imagekitUrl.trim());
      localStorage.setItem('sn_imagekit_public_key', imagekitPublicKey.trim());
      setImagekitSaved(true);
      setTimeout(() => setImagekitSaved(false), 3000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'servicenow_supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#00a389" />
            <span>Instance Configuration & Integrations</span>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="sn-form-tabs" style={{ padding: '0 20px', margin: 0, background: 'var(--now-bg-surface-alt)' }}>
          <div
            className={`sn-form-tab ${settingsTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setSettingsTab('integrations')}
          >
            Supabase & ImageKit
          </div>
          <div
            className={`sn-form-tab ${settingsTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setSettingsTab('appearance')}
          >
            Polaris Theme & Display
          </div>
          <div
            className={`sn-form-tab ${settingsTab === 'database' ? 'active' : ''}`}
            onClick={() => setSettingsTab('database')}
          >
            SQL Migration Schema
          </div>
        </div>

        <div className="sn-modal-body">
          {/* TAB 1: INTEGRATIONS */}
          {settingsTab === 'integrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Supabase Section */}
              <div
                style={{
                  border: '1px solid var(--now-border)',
                  borderRadius: 'var(--now-radius-md)',
                  padding: '16px',
                  background: 'var(--now-bg-surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} color="#3ecf8e" />
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Supabase PostgreSQL Database</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: supabaseUrl ? '#dcfce7' : '#fef3c7',
                      color: supabaseUrl ? '#15803d' : '#b45309',
                    }}
                  >
                    {supabaseUrl ? 'Configured' : 'Offline / LocalStorage Active'}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginBottom: '12px' }}>
                  Connect your personal Supabase cloud instance for persistent PostgreSQL tables. The platform also works seamlessly out-of-the-box with local browser storage.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      className="sn-field-input"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                      Supabase Anon Public API Key
                    </label>
                    <input
                      type="password"
                      className="sn-field-input"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <button
                      className="sn-btn sn-btn-primary"
                      onClick={handleSaveSupabase}
                    >
                      {supabaseSaved ? 'Saved & Connected!' : 'Save Supabase Credentials'}
                    </button>
                    <button
                      className="sn-btn sn-btn-default"
                      onClick={() => setSettingsTab('database')}
                    >
                      View Supabase SQL Schema
                    </button>
                  </div>
                </div>
              </div>

              {/* ImageKit Section */}
              <div
                style={{
                  border: '1px solid var(--now-border)',
                  borderRadius: 'var(--now-radius-md)',
                  padding: '16px',
                  background: 'var(--now-bg-surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Image size={18} color="#00a389" />
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>ImageKit Media & File Attachments</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: imagekitPublicKey ? '#dcfce7' : '#fef3c7',
                      color: imagekitPublicKey ? '#15803d' : '#b45309',
                    }}
                  >
                    {imagekitPublicKey ? 'ImageKit Ready' : 'Simulated CDN Active'}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginBottom: '12px' }}>
                  Used for ticket attachments, error logs, user avatars, and service catalog media. Automatically converts local files to optimized CDN assets.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                      ImageKit URL Endpoint
                    </label>
                    <input
                      type="text"
                      className="sn-field-input"
                      placeholder="https://ik.imagekit.io/your_imagekit_id"
                      value={imagekitUrl}
                      onChange={(e) => setImagekitUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--now-text-secondary)' }}>
                      ImageKit Public Key
                    </label>
                    <input
                      type="text"
                      className="sn-field-input"
                      placeholder="public_xxxxx"
                      value={imagekitPublicKey}
                      onChange={(e) => setImagekitPublicKey(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <button
                      className="sn-btn sn-btn-primary"
                      onClick={handleSaveImageKit}
                    >
                      {imagekitSaved ? 'Saved ImageKit Config!' : 'Save ImageKit Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {settingsTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--now-text-main)', display: 'block', marginBottom: '8px' }}>
                  Next Experience Polaris Theme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'polaris-light', label: 'Polaris Light', desc: 'Standard ServiceNow Washington DC light theme' },
                    { id: 'polaris-dark', label: 'Polaris Dark', desc: 'Deep navy/slate dark theme for developers' },
                    { id: 'high-contrast', label: 'High Contrast', desc: 'Maximum accessibility and sharp contrast' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      style={{
                        border: theme === t.id ? '2px solid #00a389' : '1px solid var(--now-border)',
                        background: theme === t.id ? 'var(--now-green-light)' : 'var(--now-bg-surface-alt)',
                        borderRadius: '6px',
                        padding: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{t.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--now-text-muted)', marginTop: '4px' }}>
                        {t.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  border: '1px solid var(--now-border)',
                  borderRadius: '6px',
                  background: 'var(--now-bg-surface-alt)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Compact Density Mode</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--now-text-secondary)', marginTop: '2px' }}>
                    Reduces padding on list view rows and form fields to view more records on screen.
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#00a389', cursor: 'pointer' }}
                  checked={compactDensity}
                  onChange={(e) => setCompactDensity(e.target.checked)}
                />
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  background: '#fef2f2',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#991b1b' }}>
                  Reset Instance to Factory Default
                </div>
                <p style={{ fontSize: '11.5px', color: '#7f1d1d', margin: '4px 0 10px' }}>
                  Restore all sample incidents, problems, changes, client scripts, and custom tables back to clean initial state.
                </p>
                <button
                  className="sn-btn sn-btn-danger"
                  onClick={() => {
                    if (confirm('Are you sure you want to restore initial demo data?')) {
                      resetToDefaultData();
                      alert('Instance has been restored to factory seed state.');
                      onClose();
                    }
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {settingsTab === 'database' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12.5px', color: 'var(--now-text-secondary)' }}>
                  Copy and run this SQL in your Supabase SQL Editor (Dashboard &gt; SQL Editor &gt; New Query) to create all platform tables:
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="sn-btn sn-btn-default" onClick={handleCopySql}>
                    <Copy size={13} />
                    <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                  <button className="sn-btn sn-btn-primary" onClick={handleDownloadSql}>
                    <Download size={13} />
                    <span>Download .sql</span>
                  </button>
                </div>
              </div>

              <pre
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '340px',
                  overflowY: 'auto',
                }}
              >
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn sn-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
