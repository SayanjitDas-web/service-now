'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Laptop,
  Code2,
  Cloud,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { CatalogItem } from '@/lib/types';
import CatalogItemOrderModal from './CatalogItemOrderModal';

export default function ServiceCatalogView() {
  const { catalogItems, openList } = usePlatform();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderingItem, setOrderingItem] = useState<CatalogItem | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<{ req: string; ritm: string } | null>(null);

  const categories = ['All', 'Hardware', 'Software', 'Access'];

  const filteredItems = catalogItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.short_description.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop size={28} color="#00a389" />;
      case 'Code2':
        return <Code2 size={28} color="#0284c7" />;
      case 'Cloud':
        return <Cloud size={28} color="#8b5cf6" />;
      case 'KeyRound':
        return <KeyRound size={28} color="#f59e0b" />;
      default:
        return <Package size={28} color="#64748b" />;
    }
  };

  return (
    <div style={{ padding: '28px 36px', background: 'var(--now-bg-surface)', minHeight: '100%', overflowY: 'auto' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1b2e3c 0%, #295e54 100%)',
          borderRadius: '10px',
          padding: '28px 32px',
          color: 'white',
          marginBottom: '28px',
          boxShadow: 'var(--now-shadow-md)',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Service Catalog</h1>
        <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '600px', marginBottom: '16px' }}>
          Browse standard enterprise hardware, developer software suites, and cloud access requests. Automated routing through approval and fulfillment workflows.
        </p>

        {/* Search bar inside hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '6px 16px',
            maxWidth: '480px',
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search catalog items, laptops, software..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              marginLeft: '8px',
              width: '100%',
              fontSize: '13px',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* Category Pills & Order History Shortcut */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`sn-btn ${selectedCategory === cat ? 'sn-btn-primary' : 'sn-btn-default'}`}
              style={{ borderRadius: '20px', padding: '5px 16px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          className="sn-btn sn-btn-default"
          onClick={() => openList('sc_req_item')}
          title="View all submitted requests and RITMs"
        >
          <span>View My Requests (RITMs)</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Catalog Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.sys_id}
            style={{
              border: '1px solid var(--now-border)',
              borderRadius: '8px',
              padding: '20px',
              background: 'var(--now-bg-surface-alt)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--now-shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            className="sn-catalog-card"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'white', border: '1px solid var(--now-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIcon(item.icon)}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#00a389', background: '#e6f7f4', padding: '2px 8px', borderRadius: '12px' }}>
                  {item.category}
                </span>
              </div>

              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--now-text-main)', marginBottom: '6px' }}>
                {item.name}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                {item.short_description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--now-border-light)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--now-text-muted)' }}>Price:</span>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--now-text-main)' }}>
                  {item.price === 0 ? 'Free / Included' : `$${item.price.toFixed(2)}`}
                </div>
              </div>

              <button
                className="sn-btn sn-btn-primary"
                style={{ padding: '5px 14px' }}
                onClick={() => setOrderingItem(item)}
              >
                <span>Request</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Item Modal */}
      {orderingItem && (
        <CatalogItemOrderModal
          item={orderingItem}
          onClose={() => setOrderingItem(null)}
          onSuccess={(reqNum, ritmNum) => {
            setOrderingItem(null);
            setOrderConfirmation({ req: reqNum, ritm: ritmNum });
          }}
        />
      )}

      {/* Order Success Confirmation Banner */}
      {orderConfirmation && (
        <div className="sn-modal-backdrop" onClick={() => setOrderConfirmation(null)}>
          <div className="sn-modal" style={{ width: '480px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="sn-modal-body" style={{ padding: '32px 24px' }}>
              <CheckCircle2 size={48} color="#15803d" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#15803d' }}>Request Submitted Successfully!</h2>
              <p style={{ fontSize: '13px', color: 'var(--now-text-secondary)', marginTop: '6px' }}>
                Your order has been logged into the ServiceNow fulfillment engine.
              </p>

              <div style={{ background: 'var(--now-bg-surface-alt)', border: '1px solid var(--now-border)', borderRadius: '6px', padding: '14px', margin: '20px 0', textAlign: 'left', fontSize: '12.5px' }}>
                <div><strong>Request Number:</strong> {orderConfirmation.req}</div>
                <div style={{ marginTop: '4px' }}><strong>Requested Item (RITM):</strong> {orderConfirmation.ritm}</div>
                <div style={{ marginTop: '4px' }}><strong>Workflow Stage:</strong> Waiting for Manager Approval</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  className="sn-btn sn-btn-primary"
                  onClick={() => {
                    setOrderConfirmation(null);
                    openList('sc_req_item');
                  }}
                >
                  View in Requested Items List
                </button>
                <button className="sn-btn sn-btn-default" onClick={() => setOrderConfirmation(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
