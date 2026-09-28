'use client';

import React from 'react';
import { Plus, Trash2, Play, RotateCcw } from 'lucide-react';
import { FilterCondition } from '@/lib/types';

interface ConditionBuilderProps {
  conditions: FilterCondition[];
  setConditions: React.Dispatch<React.SetStateAction<FilterCondition[]>>;
  availableFields: { name: string; label: string }[];
  onRun: () => void;
  onClear: () => void;
}

export default function ConditionBuilder({
  conditions,
  setConditions,
  availableFields,
  onRun,
  onClear,
}: ConditionBuilderProps) {
  const handleFieldChange = (index: number, field: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], field };
      return copy;
    });
  };

  const handleOperatorChange = (index: number, operator: any) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], operator };
      return copy;
    });
  };

  const handleValueChange = (index: number, value: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], value };
      return copy;
    });
  };

  const handleAddCondition = () => {
    const defaultField = availableFields[0]?.name || 'short_description';
    setConditions((prev) => [
      ...prev,
      { field: defaultField, operator: 'contains', value: '' },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="sn-condition-builder">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--now-text-muted)' }}>
          ServiceNow Filter Condition Builder
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="sn-btn sn-btn-default"
            style={{ padding: '3px 8px', fontSize: '11.5px' }}
            onClick={handleAddCondition}
          >
            <Plus size={12} />
            <span>AND</span>
          </button>
          <button
            className="sn-btn sn-btn-default"
            style={{ padding: '3px 8px', fontSize: '11.5px' }}
            onClick={onClear}
          >
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
          <button
            className="sn-btn sn-btn-primary"
            style={{ padding: '3px 12px', fontSize: '11.5px' }}
            onClick={onRun}
          >
            <Play size={12} fill="white" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {conditions.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--now-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
          No conditions applied. Showing all records. Click "+ AND" above to add a filter condition.
        </div>
      ) : (
        conditions.map((cond, idx) => (
          <div key={idx} className="sn-filter-row">
            {idx > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#00a389', width: '32px' }}>
                AND
              </span>
            )}
            {idx === 0 && <div style={{ width: '32px' }} />}

            {/* Field picker */}
            <select
              className="sn-filter-select"
              value={cond.field}
              onChange={(e) => handleFieldChange(idx, e.target.value)}
              style={{ minWidth: '150px' }}
            >
              {availableFields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Operator picker */}
            <select
              className="sn-filter-select"
              value={cond.operator}
              onChange={(e) => handleOperatorChange(idx, e.target.value)}
              style={{ minWidth: '110px' }}
            >
              <option value="is">is</option>
              <option value="is_not">is not</option>
              <option value="contains">contains</option>
              <option value="not_contains">does not contain</option>
              <option value="starts_with">starts with</option>
              <option value="greater_than">greater than</option>
              <option value="less_than">less than</option>
              <option value="is_empty">is empty</option>
            </select>

            {/* Value input */}
            {cond.operator !== 'is_empty' && (
              <input
                type="text"
                className="sn-filter-val-input"
                placeholder="Value..."
                value={cond.value}
                onChange={(e) => handleValueChange(idx, e.target.value)}
                style={{ flex: 1, maxWidth: '280px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRun();
                }}
              />
            )}

            <button
              onClick={() => handleRemoveCondition(idx)}
              style={{ color: '#ef4444', padding: '4px' }}
              title="Remove condition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
