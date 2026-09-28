'use client';

import React, { useState } from 'react';
import {
  Search,
  AlertCircle,
  FileText,
  GitPullRequest,
  ShoppingCart,
  BookOpen,
  User as UserIcon,
  X,
  ArrowRight,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';

interface GlobalSearchModalProps {
  onClose: () => void;
}

export default function GlobalSearchModal({ onClose }: GlobalSearchModalProps) {
  const {
    incidents,
    problems,
    changes,
    catalogItems,
    knowledgeArticles,
    users,
    openRecord,
    setActiveView,
  } = usePlatform();

  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();

  const matchingIncidents = q
    ? incidents.filter(
        (i) =>
          i.number.toLowerCase().includes(q) ||
          i.short_description.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      )
    : [];

  const matchingProblems = q
    ? problems.filter(
        (p) =>
          p.number.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q)
      )
    : [];

  const matchingChanges = q
    ? changes.filter(
        (c) =>
          c.number.toLowerCase().includes(q) ||
          c.short_description.toLowerCase().includes(q)
      )
    : [];

  const matchingCatalog = q
    ? catalogItems.filter(
        (ci) =>
          ci.name.toLowerCase().includes(q) ||
          ci.short_description.toLowerCase().includes(q)
      )
    : [];

  const matchingArticles = q
    ? knowledgeArticles.filter(
        (ka) =>
          ka.number.toLowerCase().includes(q) ||
          ka.short_description.toLowerCase().includes(q) ||
          ka.text.toLowerCase().includes(q)
      )
    : [];

  const matchingUsers = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.user_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    matchingIncidents.length +
    matchingProblems.length +
    matchingChanges.length +
    matchingCatalog.length +
    matchingArticles.length +
    matchingUsers.length;

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '640px', maxHeight: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--now-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="#00a389" />
          <input
            type="text"
            placeholder="Type to search across Incidents, Problems, Catalog, Knowledge Base, Users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              width: '100%',
              color: 'var(--now-text-main)',
            }}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: '#94a3b8' }}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sn-modal-body" style={{ padding: '12px 16px' }}>
          {!q ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>Global Search (Polaris AI / Zing Engine)</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>
                Try searching for: <span style={{ color: '#00a389', cursor: 'pointer' }} onClick={() => setQuery('outlook')}>"outlook"</span>, <span style={{ color: '#00a389', cursor: 'pointer' }} onClick={() => setQuery('vpn')}>"vpn"</span>, <span style={{ color: '#00a389', cursor: 'pointer' }} onClick={() => setQuery('laptop')}>"laptop"</span>, or <span style={{ color: '#00a389', cursor: 'pointer' }} onClick={() => setQuery('INC0010001')}>"INC0010001"</span>
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
              <p>No records or catalog items match "{query}".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Incidents */}
              {matchingIncidents.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Incidents ({matchingIncidents.length})
                  </div>
                  {matchingIncidents.map((inc) => (
                    <div
                      key={inc.sys_id}
                      onClick={() => {
                        openRecord('incident', inc.sys_id);
                        onClose();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                      className="sn-nav-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={15} color="#00a389" />
                        <span style={{ fontWeight: 600, color: '#0369a1' }}>{inc.number}</span>
                        <span style={{ fontSize: '12px', color: 'var(--now-text-main)' }}>{inc.short_description}</span>
                      </div>
                      <span className={`sn-badge sn-badge-p${inc.priority}`}>P{inc.priority}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Service Catalog */}
              {matchingCatalog.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Service Catalog Items ({matchingCatalog.length})
                  </div>
                  {matchingCatalog.map((item) => (
                    <div
                      key={item.sys_id}
                      onClick={() => {
                        setActiveView({ type: 'catalog_item', itemId: item.sys_id });
                        onClose();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      className="sn-nav-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={15} color="#00a389" />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        <span style={{ fontSize: '11.5px', color: 'var(--now-text-muted)' }}>— {item.short_description}</span>
                      </div>
                      <ArrowRight size={13} color="#94a3b8" />
                    </div>
                  ))}
                </div>
              )}

              {/* Knowledge Base */}
              {matchingArticles.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Knowledge Base Articles ({matchingArticles.length})
                  </div>
                  {matchingArticles.map((ka) => (
                    <div
                      key={ka.sys_id}
                      onClick={() => {
                        openRecord('kb_knowledge', ka.sys_id);
                        onClose();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      className="sn-nav-item"
                    >
                      <BookOpen size={15} color="#0284c7" />
                      <span style={{ fontWeight: 600, color: '#0369a1' }}>{ka.number}</span>
                      <span style={{ fontSize: '12px' }}>{ka.short_description}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Users */}
              {matchingUsers.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Users ({matchingUsers.length})
                  </div>
                  {matchingUsers.map((u) => (
                    <div
                      key={u.sys_id}
                      onClick={() => {
                        openRecord('sys_user', u.sys_id);
                        onClose();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      className="sn-nav-item"
                    >
                      <UserIcon size={15} color="#64748b" />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--now-text-muted)' }}>({u.user_name} • {u.title})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
