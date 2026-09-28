'use client';

import React, { useState } from 'react';
import { Search, UserCheck, X, Shield, Lock } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { User } from '@/lib/types';

interface ImpersonateModalProps {
  onClose: () => void;
}

export default function ImpersonateModal({ onClose }: ImpersonateModalProps) {
  const { users, currentUser, impersonateUser, actualUser, isAdmin, authError } = usePlatform();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isAdmin) {
    return (
      <div className="sn-modal-backdrop" onClick={onClose}>
        <div className="sn-modal" style={{ width: '440px' }} onClick={(e) => e.stopPropagation()}>
          <div className="sn-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#dc2626" />
              <span>Impersonation Restricted</span>
            </div>
            <button onClick={onClose} style={{ color: '#94a3b8' }}>
              <X size={18} />
            </button>
          </div>
          <div className="sn-modal-body">
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>
              {authError || 'Only users with the admin or security_admin role can impersonate other users.'}
            </p>
          </div>
          <div className="sn-modal-footer">
            <button className="sn-btn sn-btn-default" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (user: User) => {
    impersonateUser(user);
    onClose();
  };

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#00a389" />
            <span>Impersonate User</span>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div className="sn-modal-body">
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>
            Impersonation allows platform administrators to test role-based access, view user-specific UI views, and validate approvals as other corporate personas.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--now-border)',
              borderRadius: 'var(--now-radius-sm)',
              padding: '6px 12px',
              background: 'var(--now-bg-surface)',
              marginBottom: '16px',
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by user name, email, department, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                width: '100%',
                marginLeft: '8px',
                background: 'transparent',
                fontSize: '13px',
                color: 'var(--now-text-main)',
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {filteredUsers.map((u) => {
              const isCurrent = currentUser.sys_id === u.sys_id;
              const isActual = actualUser.sys_id === u.sys_id;

              return (
                <div
                  key={u.sys_id}
                  onClick={() => handleSelect(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--now-radius-md)',
                    border: '1px solid var(--now-border-light)',
                    background: isCurrent ? 'var(--now-green-light)' : 'var(--now-bg-surface-alt)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="sn-impersonate-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={u.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--now-text-main)' }}>
                          {u.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>
                          ({u.user_name})
                        </span>
                        {isActual && (
                          <span
                            style={{
                              fontSize: '10px',
                              background: '#e2e8f0',
                              color: '#475569',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Logged In Admin
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--now-text-secondary)', marginTop: '2px' }}>
                        {u.title} • {u.department}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '2px 6px',
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
              );
            })}
          </div>
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn sn-btn-default" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
