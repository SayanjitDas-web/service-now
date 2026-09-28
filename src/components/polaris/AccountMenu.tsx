'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Palette, UserRound, RotateCcw, ShieldCheck, ChevronDown } from 'lucide-react';
import { usePlatform } from '@/lib/store';

export default function AccountMenu() {
  const {
    currentUser,
    actualUser,
    isAdmin,
    logout,
    endImpersonation,
    theme,
    setTheme,
    compactDensity,
    setCompactDensity,
    resetToDefaultData,
    authError,
    clearAuthError,
  } = usePlatform();

  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isImpersonating = currentUser.sys_id !== actualUser.sys_id;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="sn-user-profile-btn"
        onClick={() => setOpen(!open)}
        title={`Account: ${actualUser.name} (${actualUser.user_name})`}
        style={{ cursor: 'pointer' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={currentUser.name}
          className="sn-user-avatar"
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
            {currentUser.name.split(' ')[0]}
          </span>
          <span style={{ fontSize: '9.5px', color: '#81b5a1' }}>
            {currentUser.roles[0]?.toUpperCase() || 'USER'}
          </span>
        </div>
        <ChevronDown size={13} color="#94a3b8" />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '320px',
            background: 'var(--now-bg-surface)',
            border: '1px solid var(--now-border)',
            borderRadius: '8px',
            boxShadow: 'var(--now-shadow-dropdown)',
            zIndex: 1200,
            overflow: 'hidden',
            color: 'var(--now-text-main)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--now-border-light)', background: 'var(--now-bg-surface-alt)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={actualUser.avatar}
                alt={actualUser.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{actualUser.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--now-text-muted)' }}>
                  {actualUser.user_name} • {actualUser.email}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {actualUser.roles.map((r) => (
                    <span
                      key={r}
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: r === 'admin' ? '#fee2e2' : r === 'itil' ? '#e0f2fe' : '#f1f5f9',
                        color: r === 'admin' ? '#b91c1c' : r === 'itil' ? '#0369a1' : '#475569',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {isImpersonating && (
              <div
                style={{
                  marginTop: '10px',
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '11.5px',
                  color: '#92400e',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  Viewing as <strong>{currentUser.name}</strong>
                </span>
                <button
                  onClick={() => {
                    endImpersonation();
                  }}
                  style={{ fontWeight: 700, textDecoration: 'underline' }}
                >
                  End
                </button>
              </div>
            )}
            {authError && (
              <div
                style={{
                  marginTop: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '11.5px',
                  color: '#991b1b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span>{authError}</span>
                <button onClick={clearAuthError} style={{ fontWeight: 700 }}>
                  ✕
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--now-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <Palette size={13} color="#00a389" />
              <span>Display & theme</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {[
                { id: 'polaris-light', label: 'Light' },
                { id: 'polaris-dark', label: 'Dark' },
                { id: 'high-contrast', label: 'Contrast' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as 'polaris-light' | 'polaris-dark' | 'high-contrast')}
                  style={{
                    flex: 1,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '5px 4px',
                    borderRadius: '5px',
                    border: theme === t.id ? '2px solid #00a389' : '1px solid var(--now-border)',
                    background: theme === t.id ? 'var(--now-green-light)' : 'var(--now-bg-surface-alt)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Compact density</span>
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={(e) => setCompactDensity(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#00a389' }}
              />
            </label>
          </div>

          <div style={{ padding: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                fontSize: '12px',
                color: 'var(--now-text-secondary)',
              }}
            >
              <UserRound size={14} />
              <span>
                {actualUser.title} • {actualUser.department}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                fontSize: '12px',
                color: 'var(--now-text-secondary)',
              }}
            >
              <ShieldCheck size={14} />
              <span>{isAdmin ? 'Administrator access granted' : 'Standard role-based access'}</span>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    return;
                  }
                  resetToDefaultData();
                  setConfirmReset(false);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12.5px',
                  borderRadius: '5px',
                  color: '#b91c1c',
                }}
                title="Restore demo incidents, problems, changes and customizations"
              >
                <RotateCcw size={14} />
                <span>{confirmReset ? 'Click again to confirm reset' : 'Reset demo data'}</span>
              </button>
            )}

            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 10px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '5px',
                color: '#0f172a',
                background: '#f1f5f9',
                marginTop: '4px',
              }}
            >
              <LogOut size={14} />
              <span>Sign out ({actualUser.user_name})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
