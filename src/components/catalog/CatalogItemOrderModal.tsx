'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, X, Shield, Clock } from 'lucide-react';
import { CatalogItem } from '@/lib/types';
import { usePlatform } from '@/lib/store';

interface CatalogItemOrderModalProps {
  item: CatalogItem;
  onClose: () => void;
  onSuccess: (reqNumber: string, ritmNumber: string) => void;
}

export default function CatalogItemOrderModal({
  item,
  onClose,
  onSuccess,
}: CatalogItemOrderModalProps) {
  const { submitCatalogOrder, users, currentUser } = usePlatform();

  // Selected recipient user (defaults to current user)
  const [requestedFor, setRequestedFor] = useState(currentUser?.sys_id || '');

  // Populate defaults
  const [variables, setVariables] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    item.variables.forEach((v) => {
      init[v.name] = v.default_value || (v.choices ? v.choices[0]?.value : '');
    });
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderNow = () => {
    // Validate mandatory
    for (const v of item.variables) {
      if (v.mandatory && !variables[v.name]) {
        alert(`Please complete mandatory variable: ${v.label}`);
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newReq = submitCatalogOrder(item.sys_id, variables, requestedFor || currentUser.sys_id);
      setIsSubmitting(false);
      onSuccess(newReq.number, newReq.ritm_number);
    }, 400);
  };

  return (
    <div className="sn-modal-backdrop" onClick={onClose}>
      <div
        className="sn-modal"
        style={{ width: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="#00a389" />
            <span>Order Catalog Item — {item.name}</span>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={17} />
          </button>
        </div>

        <div className="sn-modal-body">
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--now-border-light)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600 }}>{item.name}</h2>
              <p style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginTop: '4px' }}>
                {item.description}
              </p>
              <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11.5px', color: 'var(--now-text-muted)' }}>
                <span>Delivery: <strong>{item.estimated_delivery_days === 0 ? 'Immediate' : `${item.estimated_delivery_days} Business Days`}</strong></span>
                <span>Price: <strong>${item.price.toFixed(2)} USD</strong></span>
              </div>
            </div>
          </div>

          {/* Recipient User (Deliver To / Requested For) */}
          <div className="sn-form-group" style={{ marginBottom: '14px' }}>
            <label className="sn-field-label">
              <span className="sn-mandatory-asterisk">*</span>
              Deliver To (Requested For)
            </label>
            <select
              className="sn-field-select"
              value={requestedFor}
              onChange={(e) => setRequestedFor(e.target.value)}
              style={{ fontWeight: 500 }}
            >
              {users.map((u) => (
                <option key={u.sys_id} value={u.sys_id}>
                  {u.name} ({u.user_name}) {u.sys_id === currentUser.sys_id ? '— (Myself)' : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--now-text-muted)', marginTop: '2px' }}>
              Select the employee account that will receive and own this requested item.
            </span>
          </div>

          {/* Dynamic Variables Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
              Configuration Options & Variables
            </span>

            {item.variables.map((variable) => (
              <div key={variable.id} className="sn-form-group">
                <label className="sn-field-label">
                  {variable.mandatory && <span className="sn-mandatory-asterisk">*</span>}
                  {variable.label}
                </label>

                {variable.type === 'choice' && (
                  <select
                    className="sn-field-select"
                    value={variables[variable.name] || ''}
                    onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                  >
                    {variable.choices?.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}

                {variable.type === 'string' && (
                  <input
                    type="text"
                    className="sn-field-input"
                    value={variables[variable.name] || ''}
                    onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn sn-btn-default" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sn-btn sn-btn-primary"
            style={{ background: '#00a389', borderColor: '#008771', fontWeight: 600 }}
            onClick={handleOrderNow}
            disabled={isSubmitting}
          >
            <ShoppingCart size={14} />
            <span>{isSubmitting ? 'Processing Order...' : 'Order Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
