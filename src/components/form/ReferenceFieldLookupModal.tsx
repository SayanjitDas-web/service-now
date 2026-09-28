'use client';

import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { usePlatform } from '@/lib/store';

interface ReferenceFieldLookupModalProps {
  referenceTable: string;
  onSelect: (sys_id: string, displayValue: string) => void;
  onClose: () => void;
}

export default function ReferenceFieldLookupModal({
  referenceTable,
  onSelect,
  onClose,
}: ReferenceFieldLookupModalProps) {
  const { users, groups, cis } = usePlatform();
  const [searchTerm, setSearchTerm] = useState('');

  let records: { sys_id: string; title: string; subtitle: string; tag?: string }[] = [];

  if (referenceTable === 'sys_user') {
    records = users.map((u) => ({
      sys_id: u.sys_id,
      title: u.name,
      subtitle: `${u.user_name} • ${u.title} (${u.department})`,
      tag: u.roles[0]?.toUpperCase(),
    }));
  } else if (referenceTable === 'sys_user_group') {
    records = groups.map((g) => ({
      sys_id: g.sys_id,
      title: g.name,
      subtitle: g.description,
      tag: 'GROUP',
    }));
  } else if (referenceTable === 'cmdb_ci') {
    records = cis.map((c) => ({
      sys_id: c.sys_id,
      title: c.name,
      subtitle: `${c.class_name} • ${c.asset_tag} (${c.status})`,
      tag: c.status,
    }));
  }

  const filtered = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <span>Select {referenceTable.replace(/_/g, ' ')}</span>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={17} />
          </button>
        </div>

        <div className="sn-modal-body" style={{ padding: '12px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--now-border)',
              borderRadius: 'var(--now-radius-sm)',
              padding: '6px 10px',
              background: 'var(--now-bg-surface)',
              marginBottom: '12px',
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search reference list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                marginLeft: '8px',
                fontSize: '12.5px',
                color: 'var(--now-text-main)',
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No matching records found.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.sys_id}
                  onClick={() => {
                    onSelect(item.sys_id, item.title);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  className="sn-nav-item"
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0369a1' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  {item.tag && (
                    <span
                      style={{
                        fontSize: '10px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>
              ))
            )}
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
