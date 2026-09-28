'use client';

import React from 'react';
import { Mail, Phone, MapPin, Briefcase, Server, Tag, Info, X } from 'lucide-react';
import { usePlatform } from '@/lib/store';

interface ReferenceCardPreviewProps {
  referenceTable: string;
  sysId: string;
  onClose: () => void;
}

export default function ReferenceCardPreview({
  referenceTable,
  sysId,
  onClose,
}: ReferenceCardPreviewProps) {
  const { users, cis } = usePlatform();

  if (referenceTable === 'sys_user') {
    const user = users.find((u) => u.sys_id === sysId);
    if (!user) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '36px',
          right: '0',
          width: '280px',
          background: 'var(--now-bg-surface)',
          border: '1px solid var(--now-border)',
          borderRadius: '6px',
          boxShadow: 'var(--now-shadow-dropdown)',
          zIndex: 100,
          padding: '14px',
          animation: 'popModal 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>{user.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--now-text-secondary)' }}>
            <Mail size={13} color="#00a389" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--now-text-secondary)' }}>
              <Phone size={13} color="#00a389" />
              <span>{user.phone}</span>
            </div>
          )}
          {user.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--now-text-secondary)' }}>
              <MapPin size={13} color="#00a389" />
              <span>{user.location}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--now-text-secondary)' }}>
            <Briefcase size={13} color="#00a389" />
            <span>{user.department}</span>
          </div>
        </div>
      </div>
    );
  }

  if (referenceTable === 'cmdb_ci') {
    const ci = cis.find((c) => c.sys_id === sysId);
    if (!ci) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '36px',
          right: '0',
          width: '280px',
          background: 'var(--now-bg-surface)',
          border: '1px solid var(--now-border)',
          borderRadius: '6px',
          boxShadow: 'var(--now-shadow-dropdown)',
          zIndex: 100,
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0369a1' }}>{ci.name}</div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
          <div><strong>Class:</strong> {ci.class_name}</div>
          <div><strong>Asset Tag:</strong> {ci.asset_tag}</div>
          <div><strong>Status:</strong> {ci.status}</div>
          {ci.ip_address && <div><strong>IP:</strong> {ci.ip_address}</div>}
        </div>
      </div>
    );
  }

  return null;
}
